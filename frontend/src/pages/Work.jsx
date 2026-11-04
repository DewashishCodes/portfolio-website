import { useState } from 'react'
import content from '../content/content.json'
import { ProjectList, ViewToggle } from '../Projects'
import { Ext, PageHead, Section } from '../ui'

export default function Work() {
  const [view, setView] = useState('list')
  const more = content.moreProjects.filter((p) => p.pitch)
  return (
    <>
      <PageHead eyebrow="Work" title="Everything I've shipped" sub="Products, agents and experiments. Most of it is open source, so pick one and try it." />
      <Section title="All projects" action={<ViewToggle view={view} setView={setView} />}>
        <ProjectList projects={content.projects} view={view} />
      </Section>
      <Section title="More on GitHub">
        <ul className="mt-5 border-t border-line">
          {more.map((p) => (
            <li key={p.title} className="border-b border-line py-4">
              <Ext href={p.url} className="h3 transition-colors hover:text-muted">{p.title}</Ext>
              <p className="copy mt-1">{p.pitch}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
