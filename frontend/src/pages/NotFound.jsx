import { openCommandMenu } from '../CommandMenu'
import { Link, Reveal } from '../ui'

export default function NotFound() {
  const btn = 'inline-flex h-9 items-center rounded-full border border-line bg-chip px-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted/40'
  return (
    <Reveal className="flex flex-col items-center pt-20 pb-6 text-center">
      <img src="/mascot/casual/chibi-laptop.webp" alt="" width="150" height="150" className="size-[150px] object-contain" style={{ animation: 'float 4s ease-in-out infinite' }} />
      <p className="font-num mt-6 text-sm tracking-[0.2em] text-accent">404</p>
      <h1 className="h1-sub mt-3">This page doesn't exist</h1>
      <p className="copy mt-4 max-w-[380px] text-[16px] leading-[26px]">
        It may have moved, or the link has a typo. I looked everywhere, even under the laptop.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Link to="/" className={btn}>Go home</Link>
        <Link to="/projects" className={btn}>See my work</Link>
        <button onClick={openCommandMenu} className={btn}>Search <kbd className="ml-2 text-[11px] text-muted">⌘K</kbd></button>
      </div>
    </Reveal>
  )
}
