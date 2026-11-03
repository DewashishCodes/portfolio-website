import { useEffect, useState } from 'react'
import { checkpoints } from './scrollMap'

// One request per URL per page load; panels remount on every dwell, so cache the promise.
const cache = {}
const getJSON = (url) => (cache[url] ??= fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null))

// null until loaded or when the backend is down; callers keep their content.json fallback.
export function useLive(url) {
  const [data, setData] = useState(null)
  useEffect(() => { let on = true; getJSON(url).then((d) => on && setData(d)); return () => { on = false } }, [url])
  return data
}

const repoNames = checkpoints.filter((c) => c.repoUrl).map((c) => new URL(c.repoUrl).pathname.slice(1)).join(',')
export const REPOS_URL = `/api/github/repos?names=${encodeURIComponent(repoNames)}`
export const repoKey = (url) => new URL(url).pathname.slice(1)
