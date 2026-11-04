// Shared helpers for the Pages Functions in ../functions (kept outside that folder so they aren't routes).
export const USERNAME = 'DewashishCodes'
const CACHE_TTL = 6 * 3600 // seconds

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

/** Wrap a handler so HttpError becomes a JSON error response. */
export const route = (fn) => async (ctx) => {
  try { return await fn(ctx) } catch (e) {
    if (e instanceof HttpError) return json({ detail: e.message }, e.status)
    throw e
  }
}

/** 6 h cache in D1 so GitHub is hit at most a few times a day, from any edge location. */
export async function cached(db, key, fetchFn) {
  const now = Math.floor(Date.now() / 1000)
  const hit = await db.prepare('SELECT body FROM cache WHERE key = ? AND at > ?').bind(key, now - CACHE_TTL).first()
  if (hit) return JSON.parse(hit.body)
  const data = await fetchFn()
  await db.prepare('INSERT OR REPLACE INTO cache (key, at, body) VALUES (?, ?, ?)').bind(key, now, JSON.stringify(data)).run()
  return data
}

export async function graphql(env, query, variables = {}) {
  if (!env.GITHUB_TOKEN) throw new HttpError(503, 'GITHUB_TOKEN not set; the frontend falls back to content.json')
  let r
  try {
    r = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'dewashish-portfolio', 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    throw new HttpError(502, 'GitHub unreachable')
  }
  const body = (r.headers.get('content-type') || '').startsWith('application/json') ? await r.json() : {}
  if (r.status !== 200 || body.errors) throw new HttpError(502, `GitHub error ${r.status}`)
  return body.data
}

/** [current, longest] runs of days with contributions. Current may end yesterday if today is still empty. */
export function streaks(days, today) {
  let longest = 0, run = 0
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let past = days.filter((d) => d.date <= today) // ISO dates compare as strings
  if (past.length && past.at(-1).count === 0 && past.at(-1).date === today) past = past.slice(0, -1)
  let current = 0
  for (let i = past.length - 1; i >= 0 && past[i].count > 0; i--) current++
  return [current, longest]
}
