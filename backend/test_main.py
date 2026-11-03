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
print("ok")
