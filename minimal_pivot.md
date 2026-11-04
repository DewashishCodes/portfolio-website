# Minimal pivot: spec (reference: sumitsharma.pro, studied 2026-11-04)

Goal: replace the 3D F1 site with a quiet, editorial, single-column "design engineer" portfolio.
Copy the *system* (layout, type, colour, rhythm, interactions). Never copy Sumit's text, avatar, project names or screenshots. All content comes from `frontend/src/content/content.json`.

## 1. Page shell
- Outer page bg `#f0efeb` (warm grey). Centered column **766px** wide, bg `#faf8f3`, 1px side borders `#e7e2d9`. Inner padding `0 40px` → content width **686px**.
- Mobile: column goes full width, padding 16–20px, side borders drop.
- Sticky header, ~60px tall: bg `rgba(250,248,243,.82)` + `backdrop-filter: blur(12px) saturate(1.4)`, bottom border `#e7e2d9`.
  - Left: 24px rounded-square avatar + name (15px/500), then nav `Work · Writing · About · Craft` (15px, muted). Active route = soft pill bg `#f1ede5`.
  - Right: GitHub icon, X icon, thin vertical divider, theme toggle (moon/sun). The toggle gets a pill bg when active.

## 2. Type
- Body font: Geist Sans 16/24, ink `#1d1d20`.
- Headings: a grotesk (theirs is a custom "portfolioSans"; use **Geist** or **Inter Display**), weight 600, *tight tracking*:
  - H1 40px / 42px, letter-spacing -1.8px, colour `#39352f`
  - Section H2 19px / 24.7px, -0.57px
  - Item H3 16px / 24px, weight 550, -0.24px
  - Body copy in lists 15px / 22.5px, -0.2px, muted `#736d64`
- Section numbers `01`–`05`: 12px Manrope, accent `#e8552a`, sitting before the H2.
- Meta text (dates, badges, link labels) 13–13.5px muted.

## 3. Colour tokens (light / dark)
| token | light | dark |
|---|---|---|
| page | `#f0efeb` | ~`#0b0b0c` |
| column bg | `#faf8f3` | `hsl(240 5% 7%)` |
| ink | `#39352f` / body `#1d1d20` | `hsl(40 10% 94%)` |
| muted | `#736d64` | `hsl(240 3% 72%)` |
| border | `#e7e2d9` | `hsl(240 4% 13%)` |
| chip bg | `#f1ede5` | `hsl(240 4% 13%)` |
| accent (numbers, NOW tag) | `#e8552a` | same |
| detail / ring | `#b9530e` / `#f6821f` | same |
| live dot | green `#22c55e` | same |
Easing everywhere: `cubic-bezier(0.23, 1, 0.32, 1)`. Radius base 12px.

## 4. Home sections, top to bottom
1. **Hero** (≈70px top pad)
   - 64px avatar, rounded square (~14px radius), slight tilt/shadow, sits left of the text block.
   - Tiny greeting above the name that **cycles languages** (Hello → Hola → नमस्ते), 14px muted. Ours: Hello / नमस्ते / नमस्कार (Marathi).
   - H1 name.
   - Sub line: `Role · Role at <underlined org link>` muted 15px.
   - Lead paragraph 19px/32px ink, with **inline product chips**: 16px favicon + name inside a pill (bg `#f1ede5`, 1px border, radius 7px, padding `1px 7px 1px 4px`). One chip per product mentioned.
   - Two text CTAs: `Book a call ↗` and `Email me`, both 15px with underline offset 4px, 28px gap.
2. **01 Things I've built**: header row (number + H2 left, list/grid segmented toggle right). The toggle is a 2-button pill group with a sliding white thumb.
   - **List view**: rows split by 1px borders, ~22px vertical padding. Row = favicon (20px) + name (H3) + status badge (green dot "Live · paid", or muted "Open source" / "Early access" / "Free"), with `Website ↗` and `GitHub ↗` links right-aligned. Description below in muted 15px. Optional metric line ("$X revenue · source ↗") in 13px ink.
   - **Grid view**: 2 columns, 20px gap. Screenshot card (radius 10px, 1px border, ~208px tall), then favicon + name + globe/GitHub *icons* right, then status line, description, metric.
   - Shows 6, then a centered pill button `Show more projects ↗` (bg chip, radius 999, 13.5px) that goes to /projects.
3. **02 Experience**: rows of org name (H3) + optional orange `NOW` tag (accent text on tinted bg, 11px caps), date range right (`Aug 2026 — Present`, muted 13px), role line in 14px muted, description in 15px muted. Rows split by borders.
4. **03 How I work** (`Full kit ↗` right): one sentence with inline tech logos ("Mostly [TS] TypeScript, [React] React and [N] Next.js, styled with…"). Logos 16px inline.
5. **04 Writing** (`All writing ↗` right): rows of title (16px ink) + date right, split by borders. *We have no posts → drop this section, or replace it with "Featured" or "Research".*
6. **05 On GitHub** (`@handle ↗` right): contribution heatmap of rounded 10px squares in green tones, **with an animated snake that eats the cells**. Footer row: "**N contributions** in the past year · Updated <date>" left; `Pause snake` / `Play a round` (playable snake game) right. Data source: our existing `/api/github/contributions`.
7. **Contact band** (full-width top border): small "Contact" label, H1-sized "Let's work together.", muted line, location + timezone line, then `Email me` (with a copy-to-clipboard icon) and `Book a call ↗`.
8. **Footer**: dashed top border. Links (GitHub · X · LinkedIn · …) left, `Back to top` right. Then "Designed and built by Dewashish." Then a green dot + visitor count + "Last updated · date".

Section spacing: ~96px between sections, header row → 1px border → items.

## 5. Subpages (same shell, same header)
Common hero: small muted eyebrow (`Work`, `Writing`, `About`, `Craft`), H1 ~32px (-1px tracking), muted 17px subline, then content.
- **/projects**: "All projects" + list/grid toggle, the full project list.
- **/blog**: post rows: meta line (date · read time or "Draft"), title 17px, one-line summary muted. External posts get a ↗.
- **/about**: intro paragraphs; "Outside work" row of 3 cards (screenshot cards with caps label + title + caption); "Things I believe": 3 short principle blocks; "What I'm working on"; then 3 text links to the other pages.
- **/craft**: "From idea to browser": prose with inline tool logos, plus a list of people and influences.

## 6. Motion and interaction details
- Theme toggle: class `dark` on `<html>`, stored in localStorage, respects system preference.
- Link hover: ink darkens, underline colour strengthens; ↗ arrows nudge up and right ~1px.
- Project row hover: slight bg tint or title colour shift (keep it subtle).
- Section reveal: gentle fade/translate-up on first view (framer-motion, already installed).
- View toggle: sliding thumb (framer `layoutId`).
- Greeting text cycles with a vertical slide/blur crossfade.
- Email copy: icon swaps to a check with a small toast.

## 7. Wensity UI picks (ui.wensity.com), only where they fit the restrained look
- `github-activity-grid`: base for section 05 (we add the snake)
- `animated-tabs`: nav active pill + list/grid toggle thumb
- `text-animations`: greeting cycle
- `dynamic-island-toast`: "Email copied" toast
Skip the flashy ones (orbs, glows, marquees, gooey). They break the style.

## 8. Tech plan
- Keep Vite + React + Tailwind v4 + framer-motion. Add `react-router-dom` for the 4 subpages (or hash routes if we want zero deps).
- Drop three / r3f / drei / postprocessing / lenis / zustand once the 3D site is retired.
- Fonts: Geist via `@fontsource-variable/geist` (or Google Fonts) and Manrope for numbers.
- Backend: reuse `/api/github/contributions`, `/api/github/repos`, `/api/contact`. `/api/lap` and `/api/laps` become unused.
