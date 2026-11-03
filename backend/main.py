"""DL Grand Prix backend: GitHub telemetry proxy (6 h in-memory cache) + contact form.

Run: .venv/Scripts/python -m uvicorn main:app --port 8000 --reload
"""
import json
import os
import re
import time
from collections import defaultdict, deque
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).parent
USERNAME = "DewashishCodes"
CACHE_TTL = 6 * 3600
MESSAGES = ROOT / "data" / "messages.jsonl"


def load_env():
    # Tiny .env reader so the token never needs to live in code or the shell.
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            k, _, v = line.partition("=")
            if k.strip() and not k.startswith("#"):
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


load_env()
app = FastAPI(title="DL Grand Prix API")
_cache: dict[str, tuple[float, dict]] = {}


def cached(key, fn):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL:
        return hit[1]
    data = fn()
    _cache[key] = (time.time(), data)
    return data


def graphql(query: str, variables: dict | None = None) -> dict:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise HTTPException(503, "GITHUB_TOKEN not set; the frontend falls back to content.json")
    try:
        r = httpx.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": variables or {}},
            headers={"Authorization": f"Bearer {token}", "User-Agent": "dl-grand-prix"},
            timeout=15,
        )
    except httpx.HTTPError as e:
        raise HTTPException(502, f"GitHub unreachable: {e.__class__.__name__}")
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or body.get("errors"):
        raise HTTPException(502, f"GitHub error {r.status_code}")
    return body["data"]


def streaks(days: list[dict], today: date) -> tuple[int, int]:
    """(current, longest) runs of days with contributions. Current may end yesterday if today is still empty."""
    longest = run = 0
    for d in days:
        run = run + 1 if d["count"] > 0 else 0
        longest = max(longest, run)
    current = 0
    past = [d for d in days if date.fromisoformat(d["date"]) <= today]
    if past and past[-1]["count"] == 0 and past[-1]["date"] == today.isoformat():
        past = past[:-1]
    for d in reversed(past):
        if d["count"] == 0:
            break
        current += 1
    return current, longest


CONTRIB_Q = """
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER, first: 100) { totalCount nodes { stargazerCount } }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}"""


@app.get("/api/github/contributions")
def contributions():
    def fetch():
        u = graphql(CONTRIB_Q, {"login": USERNAME})["user"]
        cal = u["contributionsCollection"]["contributionCalendar"]
        weeks = [[{"date": d["date"], "count": d["contributionCount"]} for d in w["contributionDays"]] for w in cal["weeks"]]
        cur, longest = streaks([d for w in weeks for d in w], datetime.now(timezone.utc).date())
        return {
            "total": cal["totalContributions"],
            "weeks": weeks,
            "currentStreak": cur,
            "longestStreak": longest,
            "publicRepos": u["repositories"]["totalCount"],
            "totalStars": sum(n["stargazerCount"] for n in u["repositories"]["nodes"]),
            "followers": u["followers"]["totalCount"],
        }

    return cached("contributions", fetch)


REPO_RE = re.compile(r"^[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}$")


@app.get("/api/github/repos")
def repos(names: str = Query(..., max_length=1000)):
    wanted = sorted({n.strip() for n in names.split(",") if n.strip()})
    if not wanted or len(wanted) > 20 or not all(REPO_RE.match(n) for n in wanted):
        raise HTTPException(422, "names must be up to 20 owner/repo values")

    def fetch():
        # Values are regex-checked above, and passed as GraphQL variables, never spliced into the query text.
        params = ", ".join(f"$o{i}: String!, $n{i}: String!" for i in range(len(wanted)))
        fields = " ".join(
            f"r{i}: repository(owner: $o{i}, name: $n{i}) {{ stargazerCount forkCount pushedAt primaryLanguage {{ name }} }}"
            for i in range(len(wanted))
        )
        variables = {}
        for i, n in enumerate(wanted):
            variables[f"o{i}"], variables[f"n{i}"] = n.split("/")
        data = graphql(f"query({params}) {{ {fields} }}", variables)
        out = {}
        for i, n in enumerate(wanted):
            r = data.get(f"r{i}")
            if r:
                out[n] = {
                    "stars": r["stargazerCount"],
                    "forks": r["forkCount"],
                    "language": (r["primaryLanguage"] or {}).get("name"),
                    "pushedAt": r["pushedAt"],
                }
        return out

    return cached("repos:" + ",".join(wanted), fetch)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Contact(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=200)
    message: str = Field(min_length=5, max_length=4000)
    type: str = Field(pattern="^(recruiter|client|other)$")
    website: str = Field("", max_length=200)  # honeypot: real visitors never see or fill it

    @field_validator("email")
    @classmethod
    def valid_email(cls, v):
        if not EMAIL_RE.match(v):
            raise ValueError("invalid email")
        return v

    @field_validator("name", "message")
    @classmethod
    def strip(cls, v):
        if not v.strip():
            raise ValueError("required")
        return v.strip()


_hits: dict[str, deque] = defaultdict(deque)
RATE = 5  # messages per hour per IP


@app.post("/api/contact")
def contact(msg: Contact, request: Request):
    # shortcut: client.host is the proxy's IP behind a reverse proxy; read the trusted X-Forwarded-For once deployed.
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > 3600:
        q.popleft()
    if len(q) >= RATE:
        raise HTTPException(429, "Too many messages, try again in an hour")
    q.append(now)
    if msg.website:  # bot filled the honeypot: pretend success, store nothing
        return {"ok": True}
    MESSAGES.parent.mkdir(exist_ok=True)
    record = {"at": datetime.now(timezone.utc).isoformat(), "ip": ip, **msg.model_dump(exclude={"website"})}
    with MESSAGES.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    # TODO(email): send a notification once Resend is set up.
    return {"ok": True}
