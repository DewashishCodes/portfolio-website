// Build-time only (vite.config.js): Pit Lane markup and head tags baked into index.html.
import { renderToString } from 'react-dom/server'
import content from '../content/content.json'
import PitLane from './PitLane'

const { seo, profile, socials, education } = content
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
// og:image must be absolute for most previewers; seo.url is the deployed origin.
const abs = (p) => (seo.url ? new URL(p, seo.url).href : p)

export const renderBody = () => `<div data-ssr>${renderToString(<PitLane />)}</div>`

export function renderHead() {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    description: profile.headline,
    jobTitle: profile.now[0] && `${profile.now[0].role}, ${profile.now[0].org}`,
    image: abs(profile.avatar),
    ...(seo.url && { url: seo.url }),
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    worksFor: profile.now.map((n) => ({ '@type': 'Organization', name: n.org, ...(n.url && { url: n.url }) })),
    alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.institution })),
    sameAs: [...socials.map((s) => s.url), profile.featuredProduct.links.website].filter(Boolean),
  }
  const meta = [
    ['name', 'description', seo.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['property', 'og:image', abs(seo.ogImage)],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', `${profile.name}'s car on the grid with the race-engineer mascot`],
    ...(seo.url ? [['property', 'og:url', seo.url]] : []),
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'theme-color', '#151515'],
  ]
  return [
    `<title>${esc(seo.title)}</title>`,
    ...meta.map(([k, n, v]) => `<meta ${k}="${n}" content="${esc(v)}" />`),
    ...(seo.url ? [`<link rel="canonical" href="${esc(seo.url)}" />`] : []),
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}
