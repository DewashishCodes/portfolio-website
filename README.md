# Dewashish Lambore — portfolio

My personal site: a calm, single-column portfolio showing what I've built, how I work, and where I'm headed. *From India, for the world.*

## What's inside

- **Home**: hero with a live "Now" card, featured projects (list or card view), experience, how I work, recognition and a live GitHub contribution graph.
- **Work**: every project, each with its own page (demo clip, story, stack, screenshots).
- **About**: background, socials, toolkit carousel, research and education.
- **Resume**: viewable in the site, with a PDF download.
- **Extras**: ⌘K / `/` command menu, light and dark themes, generative ambient music (Web Audio, off by default), page transitions, live GitHub star counts, a visitor counter and a 404 page.

## Stack

| Part | Tech |
| --- | --- |
| Frontend | Vite 6, React 18, Tailwind CSS v4, framer-motion |
| Backend | FastAPI + httpx (GitHub GraphQL proxy), SQLite (visitor counter) |
| Content | One file: `frontend/src/content/content.json` |

## Run locally

```bash
# backend (port 8000)
cd backend
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000

# frontend (port 5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

The site works without the backend: the GitHub graph, star counts and visitor counter just hide.

### Environment (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Read-only token for the contributions graph and repo stats |
| `TRUSTED_PROXY_HOPS` | Number of reverse proxies in front of the API, for per-IP rate limits (default `0`) |

## Editing content

Everything shown on the site (projects, experience, socials, toolkit, the "Now" card) lives in `frontend/src/content/content.json`. Project media is in `frontend/public/media`, logos in `frontend/public/logos`.

## API

| Route | Description |
| --- | --- |
| `GET /api/github/contributions` | Contribution calendar and streaks |
| `GET /api/github/repos?names=owner/repo,...` | Stars, forks, language, last push |
| `POST /api/visit` / `GET /api/visits` | Visitor counter |

Tests: `cd backend && python test_main.py`

## Deploying

`npm run build` writes a static site to `frontend/dist`. The host must serve `index.html` for unknown paths (SPA fallback) so links like `/projects/yap` work.

## Credits

See [CREDITS.md](CREDITS.md).
