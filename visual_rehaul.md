# DL Grand Prix: Visual Rehaul and Gamification Plan

Written 2026-11-04 after a full walkthrough of the lap in Chrome (grid, T1, T2, podium, telemetry, pit stop, fan zone, finish, reload, Pit Lane). The base build works end to end. It does not yet look or feel like a standout piece. This document is the plan to get it there, split into milestones that can each ship on their own.

Reference for how things currently fit together: `frontend/src/scene/Experience.jsx` owns the canvas, `scene/Car.jsx` the cockpit model, `scene/Track.jsx` and `scene/SetPieces.jsx` the world, `panels/sections.jsx` the per-checkpoint panel content, `hud/*` the overlays, `lib/scrollMap.js` the scroll-to-track mapping, `store/useRace.js` the shared state, `content/content.json` the single source of truth.

---

## 0. Diagnosis: what is holding it back

### 0.1 The 3D world is the weakest element and gets the least screen

The cockpit camera puts the halo across the top half and the dashboard across the bottom. The info panel takes the right third. What remains is a letterbox strip, and in that strip the visitor sees:

- flat green ground with no texture variation
- cone-shaped low-poly mountains that read as placeholder
- a grandstand textured with rainbow noise (the "crowd" at the grid)
- uniform chain-link fencing with no breaks, gates or sponsor boards
- a flat, uniformly lit noon sky with no sun, no clouds, no horizon haze
- no cast shadows of note, no fog, no atmosphere

The car, the most expensive and best-looking asset in the project, is never seen from outside. The visitor only ever sees the inside of the halo.

### 0.2 Every checkpoint is the same screen

Same camera, same dark panel at the same position, same radio box, same mascot spot, same billboard with the same title as the panel. By the third corner the visitor has learned the template and stops looking. Podium is the one screen that breaks the pattern (P1/P2/P3 steps) and it is clearly the strongest screen for exactly that reason.

### 0.3 The HUD is four unrelated dark rectangles

Top sector pill, lap timer box, minimap box, radio panel. All share one flat dark-glass style, none has priority. Specific problems:

- The lap timer counts wall-clock time from the first scroll, which means nothing to the visitor.
- Speed reads 0 km/h at every dwell. The car feels parked at every checkpoint instead of racing through.
- The mascot floats over the steering wheel with no ground and no frame, and the same face appears again as the radio avatar. Two copies of the same character on screen.
- The quality pill ("AUTO · LOW") is developer information in the visitor's face.

### 0.4 The panel fights the scroll metaphor

T1, T2, Pit Stop and Finish have an inner scrollbar. The whole site says "scroll is your throttle", then asks you to scroll a text box. Pit Stop is ~40 tech chips in one list. Finish is a bare three-field form.

### 0.5 Billboards duplicate the panel

Trackside billboards are low resolution and show the checkpoint title that is already on the panel. They should carry the content the panel cannot (the project screenshot, a logo, a live number).

### 0.6 Quality auto-dropped to LOW within one second of scrolling

On the review machine the tier went High -> Low on the first scroll. Either `PerformanceMonitor` is too aggressive or the High tier is genuinely too heavy. Either way most visitors will see LOW, so the art direction must look intentional at LOW. Profile this before any visual work.

### 0.7 No ceremony

The lap starts with no lights-out sequence and ends with no chequered-flag moment. A race without a start and a finish is just a scroll.

---

## 1. Art direction (the decision everything else depends on)

### 1.1 Stylised golden hour, not photoreal

Photoreal at LOW tier reads as cheap. A deliberate stylised look reads as intentional at every tier and costs less to render. The target: the "Art of Rally" / "Absolute Drift" school. Clean flat-shaded geometry, long warm shadows, saturated kerbs, a sun low on the horizon, distance fog that eats the mountains into silhouettes.

Palette anchors (already in `content.json` livery):

- Body red `#C4161C`, saffron `#E86A1F`, cream `#F2E8D5`, carbon `#151515`
- Add: sky top `#2B3A67` -> horizon `#F4A261`, fog `#E9C9A8`, grass `#5B7A3A`, asphalt `#3A3A3E`, kerb white `#F2E8D5` + red `#C4161C`

Light: single directional sun at ~15° elevation, warm (`#FFD9A0`), with a cool fill from the sky (`#8FA8D8`). Shadows long and soft (PCF, 2048 map on High, 1024 on Medium, off on Low with a baked contact shadow under the car).

### 1.2 Atmosphere stack

In order of visual payoff per cost:

1. Linear fog matched to the horizon colour. Hides the pop-in, makes the world feel large.
2. Gradient sky with a visible sun disc and a soft halo (a single quad or `Sky` from drei with tuned turbidity).
3. Contact shadow under the car (drei `ContactShadows`) on every tier.
4. Bloom on brake lights, sun disc and the saffron accents only. Threshold high so the scene stays clean.
5. Vignette and slight warm colour grade (LUT or a `ColorAverage`/`HueSaturation` pass in `scene/Effects.jsx`).
6. Heat haze on the main straight (a small screen-space distortion over the road at distance). High tier only.
7. Tyre marks decals at the apex of each corner. Static textures, cheap.

### 1.3 Speed must be felt

Scroll speed already drives `speed` in the store. Use it:

- FOV widens from 55 at 0 km/h to 70 at full speed.
- Speed lines: a radial streak sprite on the edges of the frame, opacity tied to speed.
- Subtle camera shake proportional to speed, stronger on kerbs.
- Motion blur on the road texture (UV scroll on a streak texture) rather than a real motion blur pass.
- Engine audio pitch tied to speed when sound is on.

### 1.4 World set dressing to replace placeholders

- Grandstand: replace the noise texture with a tiled crowd sprite sheet (2 to 3 frames, flipbook at 2 fps so it moves) under a roof with the livery stripe.
- Mountains: keep low poly but give them two tones (lit face, shadow face) and fade them into the fog.
- Trees: cross-plane sprites in three sizes with a wind sway shader, not cones.
- Fencing: break it with gates, marshal posts, sponsor boards (which become the social and project boards, see milestone 3).
- Pit building at Pit Stop with open garages, the car stops in one.
- Podium structure at Podium, trophy, confetti emitter.
- Finish gantry with chequered flag and a "FINISH" sign, already partly present.
- Start gantry with the 5-light rig.

---

## 2. Milestones

Each milestone is independently shippable and has a definition of done. Order is deliberate: the camera and world first because every later screen sits on it.

### Milestone 1: Camera rig and art direction

**Goal.** The visitor sees the car, the world looks intentional at every tier, speed is felt.

**Work.**

1. Profile the High -> Low drop. Log `PerformanceMonitor` deltas, check draw calls (`renderer.info`), check if the SF90 model has an unreasonable triangle count or too many materials. Fix the root cause before touching visuals.
2. Build a camera rig with named shots, defined per checkpoint in `content.json` under a new `camera` key per checkpoint:
   - `cockpit` (current)
   - `chase` (behind and above, car fills the lower third, livery visible)
   - `trackside` (static position near the apex, car sweeps past, slight pan)
   - `heli` (high, slow orbit, for Podium and Finish)
   - `onboard-rear` (looking back at the halo and the visitor's "rival")
   Travel segments default to `chase`. Each dwell picks its own. Cut between shots with a 200 ms hard cut plus a short black frame, F1-TV style, not a lerp. Lerping between cockpit and heli looks like a glitch.
3. Implement the atmosphere stack from 1.2 in `scene/Environment.jsx` and `scene/Effects.jsx`, gated by tier in `lib/quality.js`.
4. Implement speed feel from 1.3 in `scene/Experience.jsx` (FOV, shake) and a new `hud/SpeedLines.jsx` (CSS radial gradient overlay, no WebGL needed).
5. Replace placeholders from 1.4 in `scene/SetPieces.jsx` and `scene/Track.jsx`.
6. Keep speed above 0 at dwells. Map dwell creep to a floor of ~40 km/h on the readout so the car always feels in motion. The `CREEP` constant in `scrollMap.js` already moves the car; the readout just needs a floor.

**Status (2026-11-04).** Built: tier profiling and new auto-quality, camera rig (`scene/rig.js`, `camera` per checkpoint in `content.json`), hard cuts, gradient sky and fog, shadow tiers, blob shadow, speed FOV, shake, speed lines, 40 km/h readout floor, sprite trees, two-tone hills, ground variation, crowd flipbook, fence gates, marshal posts, sponsor boards, tyre marks, FINISH sign, trophy, lit garages. Not built: heat haze (High only), engine audio pitch (no audio system exists yet).

**Done when.** A fresh load at Medium tier shows the car from outside on the first straight, mountains fade into warm fog, shadows are long, the speedometer never shows 0 while scrolling, and no placeholder noise texture remains anywhere in the lap.

### Milestone 2: Start and finish ceremonies

**Goal.** The lap has a beginning and an end that people remember.

**Work.**

1. Start sequence (`hud/Lights.jsx` + a start gantry set piece). On load: car on the grid, camera on `chase`, HUD hidden except the minimap. First scroll intent (wheel or touch, before any actual scroll) triggers: five red lights come on one per 400 ms, hold 600 ms, all out together, engine note, camera shake, speed lines, panel slides in. Lenis is locked during the lights so the visitor cannot skip it. `lightsOut` already exists in the store; extend it.
2. Reaction time. Measure the gap between lights out and the first real scroll delta. Store it in `useRace` as `reaction`. Under 200 ms: "Perfect start." radio line plus a small confetti burst. Scroll before lights out: "Jump start, five second penalty." radio line (cosmetic, no actual penalty). This is a ten-line feature with a big memorability payoff.
3. Finish sequence. On entering the Finish dwell: camera cuts to `heli`, time dilation (Lenis lerp tightened so the car crosses the line in slow motion), chequered flag waves, lap time freezes on the HUD in large type, then the contact panel slides in titled "Post-race interview".
4. Lap timer semantics. The timer runs from lights out to the finish line crossing. It pauses while the tab is hidden. It is the visitor's score (see milestone 4).

**Status (2026-11-04, session 2).** Code complete, not yet checked in a browser (the Chrome extension was not connected). Built: grid lock with five-light sequence, random hold, reaction time, jump start, launch shake, HUD reveal at lights out, finish line crossing with slow-motion run-out, chequered banner with frozen lap time, "Post-race interview" panel, confetti, lap clock from lights out to the line that pauses on a hidden tab, synthesised engine audio behind a SOUND toggle.

**Done when.** A visitor who has never seen the site understands within three seconds that this is a race they are driving, and leaves the finish with a number.

### Milestone 3: Checkpoint variety and panel redesign

**Goal.** No two checkpoints look the same. Content lives in the world, not just in a box.

**Work.**

1. Panel system in `panels/sections.jsx` becomes layout-driven. Add a `layout` key per checkpoint: `profile`, `media`, `podium`, `telemetry`, `pitstop`, `social`, `contact`. Each layout is its own component with its own position (left, right, bottom strip, full-width lower third).
2. Projects (T1 to T5) use `media` layout: the project screenshot is the hero, ~60% of the panel; the pitch is one line; the three bullets are collapsed under a "Telemetry" toggle so there is no inner scrollbar. Tags are at most six, the rest hidden under "+N".
3. Trackside billboards show the project screenshot at full resolution (1024 px texture minimum) instead of the title. Panels and billboards stop duplicating each other.
4. Podium: keep the P1/P2/P3 layout, add a camera `heli` on a real podium structure, crowd flipbook speeds up, confetti emitter fires once on arrival.
5. Telemetry: render the contribution heatmap on a pit wall screen in the world (a plane with a canvas texture updated from the live data). Panel numbers count up from 0 on arrival (300 ms, ease-out).
6. Pit Stop: the car stops in a pit box in front of the pit building. Four silhouette crew figures at the wheels. The "stationary" timer counts for real from arrival. Tech stack grouped as four tyre compounds: Soft = Languages, Medium = AI/ML, Hard = Agentic, Inter = Infra. Each compound is a tab, one visible at a time. No inner scrollbar.
7. Fan Zone: social handles become sponsor boards on the barriers as the car passes, follower counts roll. The panel keeps only the best posts.
8. Finish: form fields become one line each, one large CTA, the "Hire me / Work with me / Just saying hi" pills become the subject.
9. Mascot gets one home: inside the radio panel at roughly twice the current avatar size, with the full-body pose swapping per checkpoint. Remove the floating copy over the steering wheel. Outfit and expression already come from `content.json`.
10. HUD hierarchy: lap timer becomes the primary element (top right, larger numerals, sector colours), the sector pill merges into it, the minimap shrinks slightly, the quality pill moves into a settings drawer behind a small gear icon.

**Status (2026-11-04, session 3).** Built and checked in Chrome at 1366x639. All ten items done. Deviations: the radio moved to the bottom-left beside the minimap (it freed the right column; without that the media panel could not fit a 768 px laptop); the podium strip is a bottom-right lower third; sector bars fill yellow for now (purple and green need milestone 4 personal bests); credits moved from the contact panel to the settings drawer in the lap (the Pit Lane keeps them).

**Done when.** Scrolling through T1 to T5 shows five visibly different screens, no panel has an inner scrollbar, the mascot appears once, and the billboards show something the panel does not.

### Milestone 4: Lap timer, sectors and leaderboard

**Goal.** The visit becomes a competition.

**Work.**

1. Sectors. Split the track into three sectors at `trackT` 0.33 and 0.66. On crossing a sector line the HUD flashes the sector time: purple if it is the fastest ever recorded for this visitor, green if faster than their previous lap, yellow otherwise. Store personal bests in `localStorage`.
2. Leaderboard backend. The backend is Python with a cached GraphQL fetch. Add two endpoints: `POST /api/lap` taking `{initials, ms, tyre, reaction}` and `GET /api/laps` returning the top 20. Storage: SQLite file next to the backend. Rate limit by IP (10 submissions per hour) and reject laps under a plausible floor (a lap faster than ~8 s is a scroll-to-end, not a race).
3. Timing tower. On Finish, before the contact panel, show an F1-style timing tower: top 10 plus the visitor's own row highlighted with their position. Three-letter initials input, Enter to submit.
4. Lap validity. A lap only counts if the visitor passed through every dwell zone (`active` reached every index). Skipping via keyboard Home/End or the minimap invalidates the lap and the HUD shows "LAP INVALID" in yellow, like track limits.

**Done when.** Two people racing the site on two machines can see each other on the tower.

### Milestone 5: Race mechanics (DRS, tyres, collectibles, achievements)

**Goal.** Give the visitor choices and secrets.

**Work.**

1. DRS. Two DRS zones on the long straights (marked by a detection line and a white board in the world). Inside a zone, holding Shift (desktop) or a long press (touch) multiplies scroll delta by 2 and opens a rear-wing flap on the car. The HUD shows a green DRS badge. Teaches fast navigation as a race mechanic.
2. Tyre choice at the grid. Before lights out, three tyre buttons: Soft (short dwells, ~0.6 viewport, quick skim), Medium (current), Hard (long dwells, 1.4 viewport, full read with bullets expanded by default). This is a reading-mode selector dressed as strategy. Store the choice in `useRace`, rebuild `segs` in `scrollMap.js` from the chosen dwell length.
3. Collectibles. Thirteen pit boards hidden in the world, one per checkpoint, slightly off the camera's natural line (behind a tree, on the pit building roof). Clicking one plays a radio line and ticks a counter on the HUD. All thirteen unlocks a secret radio message and marks the resume download with a "Full lap" stamp. Persist in `localStorage`.
4. Achievements as radio toasts, in character, each at most eight words: "Perfect start.", "Purple sector.", "All projects opened.", "Found the hidden board.", "Night race.", "Lap complete, P4 overall."
5. Night race. Read the visitor's local hour. 19:00 to 06:00 gets floodlit night: dark sky, cold floodlights on masts, warm pit building glow, car headlights, the heatmap screen glows. Same geometry, different lighting rig in `scene/Environment.jsx`. Huge perceived variety for one lighting preset.

**Done when.** A second visit feels different from the first (tyre, time of day, collectibles found).

### Milestone 6: Shareable race card and branching radio

**Goal.** The thing people post, and a lap that adapts to who is driving.

**Work.**

1. Race card. On Finish, render a 1200x630 canvas: livery colours, visitor's initials, lap time, three sector times, tyre, reaction time, position on the leaderboard, a small render of the car (pre-rendered PNG, not live WebGL). "Download" and "Copy link" buttons. The link carries the lap id so the OG image endpoint (`GET /api/card/:id.png`, generated server-side with Pillow from the same layout) shows the card in social previews.
2. Branching radio. At T1 and at Podium the radio offers two reply buttons: "I'm hiring" and "I'm building". The choice flips a `path` flag in `useRace`. Hiring path: later panels lead with results and the contact form defaults to "Hire me". Building path: panels lead with the "Built" bullet, tags expanded, repo links first, contact defaults to "Work with me". The mascot lines change too, which means a second `line` per checkpoint in `content.json`, keyed by path.
3. Photo mode. Press C anywhere to freeze the scroll, hide the HUD, and get a free orbit camera around the car with the current shot as the starting point. Screenshot button saves a PNG.

**Done when.** A card posted to X or LinkedIn shows the visitor's lap and links back to the site.

---

## 3. Order and rough effort

| Milestone | Why this order | Rough effort |
|---|---|---|
| 1 Camera and art direction | Everything else sits on it; biggest visual delta | 3 to 5 days |
| 2 Start and finish | Cheap, frames the whole experience | 1 to 2 days |
| 3 Checkpoint variety | Removes the monotony, fixes the scroll conflict | 3 to 4 days |
| 4 Timer and leaderboard | First real gamification, needs backend writes | 2 days |
| 5 Race mechanics | Replay value, secrets | 2 to 3 days |
| 6 Share card and branching | Distribution, personalisation | 2 days |

Milestone 1 before anything. Milestones 2 and 3 can be swapped. Milestones 4 to 6 each need 1 to 3 shipped first.

---

## 4. Known gaps from the review

Not checked in this session:

- Why High tier drops to Low on the first scroll. Must be profiled first.
- Mobile layout and touch scroll feel.
- Contact form submission end to end.
- The loader screen (`hud/Loader.jsx`) never appeared on reload, either too fast or not wired to asset progress.

Risks:

- Leaderboard and share card need write endpoints plus rate limiting; the backend currently only reads.
- Camera cuts need every checkpoint's `camera` entry tuned by hand in `content.json`; there is no shortcut for that.
- Night mode doubles the lighting presets to maintain. Build it last within milestone 5.

---

## 5. Session log and where to resume

### 2026-11-04: Milestone 1 (mostly done)

Root cause of the High -> Low drop: drei `PerformanceMonitor` (45 fps bound, 3 flip-flops) read one-off hitches as sustained low fps. Those hitches come from first-time shader compiles, texture uploads and background-tab throttling, which hit 2 fps in an automated tab. A warm frame renders in 6 to 10 ms (~280 draw calls, ~1M triangles including the shadow pass, of which the car is ~166k), so the scene weight is not the problem. Fix in `scene/Experience.jsx`:
- custom `AutoQuality` that ignores frames over 200 ms, ignores 4 s of warm-up after load or a tier change, steps down only after two bad 2 s windows, and never climbs back into a tier that failed;
- `<Preload all />` compiles every shader before the first scroll;
- shadow type and map size switched per tier without remounting the Canvas.

Architecture changes:
- `scene/rig.js` is new: shared mutable `rig` state (car transform, t, speed, kerb) plus `shotFor(active)` and `poseCamera()`. Shots: `chase`, `cockpit`, `trackside`, `heli`, `onboard-rear`. Per-checkpoint config is the `camera` key in `content.json`, either a string or `{ shot, ahead, lateral, side, height, radius, angle }`.
- `scene/Car.jsx`: the car now lives in world space, no longer portalled into the camera. It drives the camera through `poseCamera`, runs the hard cuts (`#cut` div in `App.jsx`, 90 ms of black, 0.7 s minimum hold), speed FOV, shake, film offset when the panel is open, and the 40 km/h readout floor.
- `scene/Environment.jsx`: gradient sky dome (horizon = fog colour), `PALETTE`, sun following the car, hemisphere fill, sprite trees with wind sway (shared shader patch on the shadow depth material), two-ring hills, vertex-coloured ground.
- `hud/SpeedLines.jsx` and the CSS in `index.css`.

Resume with:
1. Milestone 1 leftovers: heat haze on the main straight (High only), and engine audio pitch (needs a sound system first, `soundOn` exists in the store but nothing plays).
2. Test real fps on a normal (non-automated) browser at each tier and tune `LOW_FPS` / `HIGH_FPS` in `Experience.jsx` if the tier still moves.
3. Hand-tune `camera` entries per checkpoint. Heli angles are in the car frame (0 = in front, PI = behind, car local +x = driver's left).
4. Then Milestone 2 (lights-out start, reaction time, finish sequence).

Gotchas:
- Editing `scene/rig.js` with the dev server running can leave two copies of the `rig` module under HMR, and the camera goes wrong until a full reload.
- One High-tier load showed a speed reading (51 km/h) with no scroll input, likely from browser scroll restoration.
- Chrome automation tabs throttle requestAnimationFrame, so fps measured there is not real. Use `gl.render` plus `gl.getContext().finish()` timing for GPU cost instead.

### 2026-11-04 (session 2): Milestone 2 built, engine audio added

New files:
- `hud/Lights.jsx`: the start. On the grid Lenis is stopped (`html.lenis-stopped` hides overflow) and only the minimap and nav show. The first scroll intent (wheel, touch drag, scroll key or the START THE LAP button) lights five reds 400 ms apart, holds 600 ms plus up to 600 ms random, then lights out: `lenis.start()`, `start: 'go'`, `lightsOutAt`. Intents are grouped into gestures by a 250 ms quiet gap so trackpad momentum is one gesture. A new gesture during the lights is a jump start; the first new gesture after lights out is the reaction time (under 200 ms = perfect start plus confetti). `skipStart()` is used when coming back from the Pit Lane mid-lap.
- `hud/FinishBanner.jsx`: on crossing the line, chequered strip, lap time in large type for 2.8 s, then sets `interview` so the finish panel opens (label `panelLabel: "POST-RACE INTERVIEW"` in content.json).
- `hud/Confetti.jsx`: 2D canvas burst from two bottom corners, fired by bumping `confetti` in the store. Off under reduced motion. Reusable for the podium in milestone 3.
- `lib/audio.js`: WebAudio engine (saw + square through a resonant low-pass), pitch saw-tooths through the gears. The context is only created from the SOUND toggle click, suspends on a hidden tab. During the lights `rig.rev` revs it.

Changes:
- `lib/scrollMap.js` exports `START_T` and `FINISH_T`. The finish dwell now runs from the checkpoint to 20 m past the line, so the car crosses it slowly in the last viewport; a jump to the finish lands at 0.9 of the dwell, past the line. The finish gantry moved from +55 m to +25 m. Lenis lerp drops to 0.035 in the finish dwell.
- `store/useRace.js`: `ready`, `start`, `lights`, `lightsOutAt`, `reaction`, `jumpStart`, `finishedAt`, `interview`, `cue`, `confetti`, and `radio(line, outfit, expression)` for race-event radio lines (they hold the radio for 4.5 s).
- `scene/Car.jsx`: lap clock (real time, pauses when a frame gap is over 1 s), finish detection, launch shake, engine update.
- `hud/Loader.jsx` is now a progress bar with the mascot; the start lights live only on the grid.
- `history.scrollRestoration = 'manual'` and a scroll to top on load, which fixes the phantom 51 km/h on reload.

Resume with:
1. Browser pass on milestone 2: start on wheel, trackpad, touch, keyboard and the button; jump start; perfect start; finish banner timing; heli framing of the finish gantry at +25 m (retune `finish.camera` if the gantry is out of frame); engine sound level.
2. Milestone 1 leftover still open: heat haze (High only).
3. Then milestone 3.

### 2026-11-04 (session 3): Milestone 3 built and checked in a browser

The browser pass (Chrome, 1366x639 viewport) also covered milestone 2: grid, START THE LAP, lights out, HUD reveal, reaction readout, finish crossing, FINISHED tag, post-race interview panel. All work.

Layout system:
- `panels/layouts.js`: `LAYOUTS` (side and width per layout) and `frameFor(cp, width)`. `Car.jsx` reads it to push the car into the free side of the frame. Every checkpoint has `layout` in content.json; projects alternate `panelSide` left and right.
- `panels/InfoPanel.jsx` places by side. Panels size to their content with a max height. Left: below the nav, above the minimap and radio. Right: below the lap timer, down to the edge. Bottom (podium): right of the radio, falls back to the right edge below about 1150 px wide.
- `panels/sections.jsx`: shared `Tabs` (one tab at a time in the lap, all stacked in the Pit Lane), `CountUp`, and `Tags max` with "+N". Projects: screenshot hero (capped at 27vh), first sentence of the pitch, five tags, and a TELEMETRY toggle that swaps the bullets into the hero box. Stack: tyre-compound tabs and a real stationary clock. Research: one paper at a time. Team HQ: three tabs. Fan zone: three best posts plus platform buttons. Contact: name and email side by side, one big send button.

World:
- Billboards (`scene/Checkpoints.jsx`) are 1600x900. Projects show the full-bleed screenshot; other checkpoints show their `board` fact from content.json.
- `scene/SetPieces.jsx`: pit wall telemetry screen (canvas: full-year heatmap and sparkline from the live API, fallback numbers offline), moved so it sits behind the car in its trackside shot; pit box with four crew and a lollipop man (the pit stop checkpoint has `stop: true`: no creep, and the readout may show 0); fan zone social boards angled at the oncoming car; crowd flipbook at 7 fps at podium and finish; podium confetti fires once on first arrival (`hud/Confetti.jsx`).
- The heli shot now sways around its framed angle instead of orbiting (a long dwell used to swing the camera in front of the car and lose it). Onboard-rear camera raised to clear the nose bodywork. Pit stop heli re-aimed (ahead 6, radius 24).

HUD: the sector pill merged into the lap timer (label, clock, speed, S1 to S3 bars, reaction). The mascot appears only in the radio, full-body when the checkpoint has a pose. Minimap is 168x118. Settings drawer behind a gear: sound, graphics tier, credits. The idle radio line now counts from lights out.

Resume with:
1. Milestone 4 (sector colours, leaderboard backend, timing tower, lap validity).
2. Still open from milestone 1: heat haze.
3. Unverified: phone layouts (bottom sheet and full-width radio against the minimap), the live heatmap on the pit wall screen (the backend was not running), podium confetti timing in a normal tab.

Gotcha: the Chrome automation tab runs at about 0.5 fps, so after a jump the car takes ~40 s to catch up there. Judge framing only after waiting.
