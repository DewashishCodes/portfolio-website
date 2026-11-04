import { json } from '../../server/lib.js'

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare("SELECT n FROM counters WHERE name = 'visits'").first()
  return json({ visits: row?.n ?? 0 })
}
