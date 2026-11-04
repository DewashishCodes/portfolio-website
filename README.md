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
| Backend | Cloudflare Pages Functions (GitHub GraphQL proxy), D1 (visitor counter, 6 h GitHub cache) |
| Content | One file: `frontend/src/content/content.json` |

## Run locally

```bash
cd frontend
npm install
npm run build && npm run api   # Pages Functions + D1 on :8788
npm run dev                    # site on :5173, proxies /api to :8788
```

The first time, create the local database with `npx wrangler d1 execute portfolio --file schema.sql --local`.

The site works without the API: the GitHub graph, star counts and visitor counter just hide.

### Secrets

| Where | Variable | Purpose |
| --- | --- | --- |
| `frontend/.dev.vars` (local) and Pages secrets (production) | `GITHUB_TOKEN` | Read-only token for the contributions graph and repo stats |

## Editing content

Everything shown on the site (projects, experience, socials, toolkit, the "Now" card) lives in `frontend/src/content/content.json`. Project media is in `frontend/public/media`, logos in `frontend/public/logos`.

## API

| Route | Description |
| --- | --- |
| `GET /api/github/contributions` | Contribution calendar and streaks |
| `GET /api/github/repos?names=owner/repo,...` | Stars, forks, language, last push |
| `POST /api/visit` / `GET /api/visits` | Visitor counter |

Code: `frontend/functions/api/*` (routes), `frontend/server/lib.js` (shared helpers), `frontend/schema.sql` (D1 tables). Tests: `npm test`.

## Deploying

Hosted on Cloudflare Pages (project `dewashish-portfolio`, D1 database `portfolio`):

```bash
cd frontend
npx wrangler login        # once
npm run deploy            # build + upload
npx wrangler pages secret put GITHUB_TOKEN --project-name dewashish-portfolio   # once
npx wrangler d1 execute portfolio --file schema.sql --remote                     # once, or after schema changes
```

Pages serves `index.html` for unknown paths, so links like `/projects/yap` work.

## Credits

See [CREDITS.md](CREDITS.md).
