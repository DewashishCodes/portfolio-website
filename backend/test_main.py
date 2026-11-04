"""Self-check: .venv/Scripts/python test_main.py"""
import json
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

# Laps: validation, ranking, tie order, top list, rate limit.
main.LAPS_DB = main.ROOT / "data" / "test-laps.db"
main.LAPS_DB.unlink(missing_ok=True)
main._hits.clear()
lap = {"initials": "dlb", "ms": 61_000, "sectors": [20_000, 21_000, 20_000], "reaction": 240}
assert c.post("/api/lap", json={**lap, "ms": 5_000, "sectors": None}).status_code == 422  # scroll-to-end
assert c.post("/api/lap", json={**lap, "initials": "D!"}).status_code == 422
assert c.post("/api/lap", json={**lap, "sectors": [1, 2, 3]}).status_code == 422  # must add up
assert c.post("/api/lap", json={**lap, "tyre": "slick"}).status_code == 422
r = c.post("/api/lap", json=lap).json()
assert r["position"] == 1 and r["total"] == 1
assert c.post("/api/lap", json={**lap, "initials": "ABC", "ms": 50_000, "sectors": None}).json()["position"] == 1
assert c.post("/api/lap", json={**lap, "initials": "XYZ"}).json()["position"] == 3  # tie: the earlier lap stays ahead
top = c.get("/api/laps", params={"ms": 55_000}).json()
assert [x["initials"] for x in top["laps"]] == ["ABC", "DLB", "XYZ"] and top["rank"] == 2 and top["total"] == 3
assert top["laps"][1]["sectors"] == [20_000, 21_000, 20_000]
for _ in range(7):
    c.post("/api/lap", json=lap)
assert c.post("/api/lap", json=lap).status_code == 429
main.LAPS_DB.unlink()
print("ok")
