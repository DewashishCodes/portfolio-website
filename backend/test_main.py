"""Self-check: .venv/Scripts/python test_main.py"""
import json
import os
from datetime import date

import main
from fastapi.testclient import TestClient

main.MESSAGES = main.ROOT / "data" / "test-messages.jsonl"
main.MESSAGES.unlink(missing_ok=True)
c = TestClient(main.app)

# Streaks: today still empty does not break the current streak.
days = [{"date": f"2026-11-0{i}", "count": n} for i, n in zip(range(1, 6), [1, 0, 2, 3, 0])]
assert main.streaks(days, date(2026, 11, 5)) == (2, 2)
assert main.streaks(days, date(2026, 11, 6)) == (0, 2)

# Contact: validation, storage, honeypot, rate limit.
good = {"name": "Asha", "email": "asha@example.com", "message": "Hello there", "type": "recruiter"}
assert c.post("/api/contact", json={**good, "email": "nope"}).status_code == 422
assert c.post("/api/contact", json={**good, "type": "spam"}).status_code == 422
assert c.post("/api/contact", json=good).status_code == 200
assert c.post("/api/contact", json={**good, "website": "x"}).status_code == 200
lines = main.MESSAGES.read_text(encoding="utf-8").splitlines()
assert len(lines) == 1 and json.loads(lines[0])["name"] == "Asha"
for _ in range(3):
    c.post("/api/contact", json=good)
assert c.post("/api/contact", json=good).status_code == 429

# Repos: bad names rejected before any GitHub call.
assert c.get("/api/github/repos", params={"names": "bad name"}).status_code == 422

main.MESSAGES.unlink()

# Visits: counts up, reads without counting, rate limited per IP.
main.SITE_DB = main.ROOT / "data" / "test-site.db"
main.SITE_DB.unlink(missing_ok=True)
main._hits.clear()
assert c.get("/api/visits").json() == {"visits": 0}
assert c.post("/api/visit").json() == {"visits": 1}
assert c.post("/api/visit").json() == {"visits": 2}
assert c.get("/api/visits").json() == {"visits": 2}
for _ in range(18):
    c.post("/api/visit")
assert c.post("/api/visit").status_code == 429
assert c.get("/api/visits").json() == {"visits": 20}
main.SITE_DB.unlink()

# Client IP: X-Forwarded-For only counts behind trusted proxies, and only the hop the proxy wrote.
class Req:
    def __init__(self, xff):
        self.headers = {"x-forwarded-for": xff} if xff else {}
        self.client = type("C", (), {"host": "10.0.0.1"})()

os.environ.pop("TRUSTED_PROXY_HOPS", None)
assert main.client_ip(Req("1.2.3.4")) == "10.0.0.1"  # no trusted proxy: header ignored
os.environ["TRUSTED_PROXY_HOPS"] = "1"
assert main.client_ip(Req("6.6.6.6, 1.2.3.4")) == "1.2.3.4"  # forged left entry ignored
assert main.client_ip(Req("")) == "10.0.0.1"
os.environ.pop("TRUSTED_PROXY_HOPS")
print("ok")
