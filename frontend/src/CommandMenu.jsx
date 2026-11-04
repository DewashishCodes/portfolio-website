import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isAmbientOn, toggleAmbient } from './ambient'
import content from './content/content.json'
import { AppIcon, Icons, toggleTheme } from './ui'

const { projects, profile, contact, socials } = content

export const openCommandMenu = () => dispatchEvent(new Event('opencommand'))

function go(path) {
  if (path !== location.pathname) {
    history.pushState(null, '', path)
    dispatchEvent(new PopStateEvent('popstate'))
  }
}

const isTyping = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable

export default function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [flash, setFlash] = useState('')
  const input = useRef(null)
  const list = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !isTyping(e)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpen = () => setOpen(true)
    addEventListener('keydown', onKey)
    addEventListener('opencommand', onOpen)
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('opencommand', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setFlash('')
      requestAnimationFrame(() => input.current?.focus())
    }
  }, [open])

  const items = useMemo(() => {
    const github = socials.find((s) => s.platform === 'GitHub')?.url
    return [
      { group: 'Pages', label: 'Home', run: () => go('/') },
      { group: 'Pages', label: 'Work', run: () => go('/projects') },
      { group: 'Pages', label: 'About', run: () => go('/about') },
      { group: 'Pages', label: 'Resume', run: () => go('/resume') },
      ...projects.map((p) => ({ group: 'Projects', label: p.title, hint: p.status, icon: <AppIcon p={p} size={18} />, run: () => go(`/projects/${p.slug}`) })),
      {
        group: 'Actions',
        label: 'Copy email address',
        hint: contact.email,
        keepOpen: true,
        run: () => navigator.clipboard?.writeText(contact.email).then(() => setFlash('Email copied')),
      },
      { group: 'Actions', label: 'Toggle theme', run: toggleTheme },
      { group: 'Actions', label: isAmbientOn() ? 'Turn ambient music off' : 'Play ambient music', run: toggleAmbient },
      { group: 'Actions', label: 'Open GitHub', hint: profile.name, run: () => window.open(github, '_blank', 'noopener') },
    ]
  }, [open])

  const shown = items.filter((it) => (it.label + ' ' + (it.hint || '') + ' ' + it.group).toLowerCase().includes(q.trim().toLowerCase()))

  const run = (it) => {
    if (!it) return
    it.run()
    if (!it.keepOpen) setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = shown.length
      const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % Math.max(n, 1)
      setActive(next)
      list.current?.children[next]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') run(shown[active])
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/25 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="mx-auto max-w-[560px] overflow-hidden rounded-[14px] border border-line bg-col shadow-[0_24px_60px_-12px_rgba(0,0,0,.35)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <span className="text-muted">{Icons.search}</span>
              <input
                ref={input}
                value={q}
                onChange={(e) => (setQ(e.target.value), setActive(0))}
                onKeyDown={onKeyDown}
                placeholder="Search pages, projects, actions…"
                aria-controls="cmd-list"
                aria-activedescendant={shown[active] ? `cmd-${active}` : undefined}
                className="h-12 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted focus-visible:outline-none"
              />
              <kbd className="rounded-[5px] border border-line px-1.5 text-[11px] text-muted">esc</kbd>
            </div>
            <ul id="cmd-list" ref={list} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {shown.length === 0 && <li className="copy px-3 py-6 text-center">Nothing matches “{q}”.</li>}
              {shown.map((it, i) => (
                <li key={it.group + it.label}>
                  {(i === 0 || shown[i - 1].group !== it.group) && <p className="meta px-3 pt-2 pb-1">{it.group}</p>}
                  <button
                    id={`cmd-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(it)}
                    className={`flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[14.5px] text-ink ${i === active ? 'bg-chip' : ''}`}
                  >
                    {it.icon}
                    <span>{flash && it.keepOpen ? flash : it.label}</span>
                    {it.hint && <span className="meta ml-auto truncate pl-4">{it.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-4 border-t border-line px-4 py-2 text-[11.5px] text-muted">
              <span>↑↓ to move</span>
              <span>↵ to open</span>
              <span className="ml-auto">⌘K or / anywhere</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
