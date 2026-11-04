import { useEffect, useState } from 'react'

// One request per URL per page load, shared across remounts.
const cache = {}
const getJSON = (url) => (cache[url] ??= fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null))

// null until loaded or when the backend is down; callers fall back to content.json.
export function useLive(url) {
  const [data, setData] = useState(null)
  useEffect(() => { let on = true; getJSON(url).then((d) => on && setData(d)); return () => { on = false } }, [url])
  return data
}
