import { HttpError, cached, graphql, json, route } from '../../../server/lib.js'

const REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/

export const onRequestGet = route(async ({ request, env }) => {
  const names = new URL(request.url).searchParams.get('names') || ''
  const wanted = [...new Set(names.split(',').map((n) => n.trim()).filter(Boolean))].sort()
  if (names.length > 1000 || !wanted.length || wanted.length > 20 || !wanted.every((n) => REPO_RE.test(n)))
    throw new HttpError(422, 'names must be up to 20 owner/repo values')

  return json(await cached(env.DB, 'repos:' + wanted.join(','), async () => {
    // Values are regex-checked above and passed as GraphQL variables, never spliced into the query text.
    const params = wanted.map((_, i) => `$o${i}: String!, $n${i}: String!`).join(', ')
    const fields = wanted.map((_, i) => `r${i}: repository(owner: $o${i}, name: $n${i}) { stargazerCount forkCount pushedAt primaryLanguage { name } }`).join(' ')
    const variables = {}
    wanted.forEach((n, i) => ([variables[`o${i}`], variables[`n${i}`]] = n.split('/')))
    const data = await graphql(env, `query(${params}) { ${fields} }`, variables)
    const out = {}
    wanted.forEach((n, i) => {
      const r = data[`r${i}`]
      if (r) out[n] = { stars: r.stargazerCount, forks: r.forkCount, language: r.primaryLanguage?.name ?? null, pushedAt: r.pushedAt }
    })
    return out
  }))
})
