import { useEffect, useState } from 'react'
import content from './content/content.json'

// One request per URL per page load, shared across remounts.
const cache = {}
const getJSON = (url) => (cache[url] ??= fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null))

// null until loaded or when the backend is down; callers fall back to content.json.
export function useLive(url) {
  const [data, setData] = useState(null)
  useEffect(() => { let on = true; getJSON(url).then((d) => on && setData(d)); return () => { on = false } }, [url])
  return data
}

// "owner/repo" from a GitHub URL; org pages (github.com/yap-voice) have no repo and give undefined.
const repoOf = (url) => url?.match(/github\.com\/([^/]+\/[^/#?]+)/)?.[1]
const REPOS_URL = `/api/github/repos?names=${encodeURIComponent(content.projects.map((p) => repoOf(p.github)).filter(Boolean).join(','))}`

/** Live star count for a project, or undefined while loading / offline. */
export function useStars(p) {
  return useLive(REPOS_URL)?.[repoOf(p.github)]?.stars
}
