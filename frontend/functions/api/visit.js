import { json } from '../../server/lib.js'

const VISIT_RATE = 20 // counted visits per hour per IP; the browser also only counts itself once

// Store a hash, not the raw IP.
async function ipKey(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('visit:' + ip))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequestPost({ request, env }) {
  const db = env.DB
  const now = Math.floor(Date.now() / 1000)
  // CF-Connecting-IP is set by Cloudflare itself and can't be forged by the client.
  const key = await ipKey(request.headers.get('cf-connecting-ip') || 'unknown')
  await db.prepare('DELETE FROM hits WHERE at < ?').bind(now - 3600).run()
  const { n } = await db.prepare('SELECT COUNT(*) AS n FROM hits WHERE key = ?').bind(key).first()
  if (n >= VISIT_RATE) return json({ detail: 'Already counted' }, 429)
  const [, , row] = await db.batch([
    db.prepare('INSERT INTO hits (key, at) VALUES (?, ?)').bind(key, now),
    db.prepare("UPDATE counters SET n = n + 1 WHERE name = 'visits'"),
    db.prepare("SELECT n FROM counters WHERE name = 'visits'"),
  ])
  return json({ visits: row.results[0].n })
}
