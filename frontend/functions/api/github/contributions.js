import { USERNAME, cached, graphql, json, route, streaks } from '../../../server/lib.js'

const Q = `
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER, first: 100) { totalCount nodes { stargazerCount } }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`

export const onRequestGet = route(async ({ env }) =>
  json(await cached(env.DB, 'contributions', async () => {
    const u = (await graphql(env, Q, { login: USERNAME })).user
    const cal = u.contributionsCollection.contributionCalendar
    const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
    const [currentStreak, longestStreak] = streaks(weeks.flat(), new Date().toISOString().slice(0, 10))
    return {
      total: cal.totalContributions,
      weeks,
      currentStreak,
      longestStreak,
      publicRepos: u.repositories.totalCount,
      totalStars: u.repositories.nodes.reduce((s, n) => s + n.stargazerCount, 0),
      followers: u.followers.totalCount,
    }
  })),
)
