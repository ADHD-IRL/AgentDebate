# Handoff: Dashboard Redesign · Events-by-Date

## Overview

A **second** redesign pass of the AgentDebate Dashboard, evolving from the analyst-triage layout into a **cleaner, workflow-first dashboard** organised around dated events. The prior design surfaced too many panels (priority queue + matrix + coverage + feed + KPIs); this design strips it back to three concerns:

1. A short **KPI rail** (3 tiles, aligned rows).
2. A compact **workflow-state strip** showing pipeline counts across stages.
3. A **single events list** that groups in-progress and completed sessions by date (Today / Upcoming / Recent), with every row clickable to drill into the session.

The deliverable is a running React+Babel prototype at `Dashboard Clean.html`, plus supporting `src/*.jsx` shared atoms.

## Screenshots

| # | File | What it shows |
|---|---|---|
| 01 | `screenshots/01-overview.png` | Full default view — `ALL` filter, KPI rail + pipeline strip + TODAY group + start of UPCOMING |
| 02 | `screenshots/02-full-page.png` | Scrolled to end — UPCOMING and RECENT groups in full |
| 03 | `screenshots/03-filter-in-progress.png` | `IN PROGRESS` filter — RECENT group hidden, count shows "7 in progress" |
| 04 | `screenshots/04-filter-complete.png` | `COMPLETE` filter — only the RECENT group renders with 4 completed sessions |
| 05 | `screenshots/05-tweaks-open.png` | Tweaks panel open (prototype-only; **do not port**) showing the design knobs that were explored |

## About the Design Files

The files in this bundle are **design references created in HTML/React (via Babel standalone)** — a running prototype demonstrating intended layout, typography, colour, density, and interactions. **They are not production code to ship directly.**

The task is to **re-implement this design inside the existing AgentDebate codebase** (React + Vite + Tailwind + shadcn/ui, with the WARROOM token system defined in `src/index.css`) by modifying `src/pages/Dashboard.jsx` and adding new components under `src/components/dashboard/`. Use the existing primitives in `src/components/ui/*` (Card, Button, Badge, etc.), the `useWorkspace()` hook, and the `--wr-*` CSS tokens already in place.

## Fidelity

**High-fidelity.** All colours, spacing, typography, grid templates, and row layouts are final. The mock data inside `Dashboard Clean.html` (the inline `EVENTS` array) is illustrative — replace it with a derived shape from the real entities (`Session`, `SessionAgent`, `SessionSynthesis`, `Scenario`, `Agent`) loaded via `useWorkspace().db`.

## Page Structure

Single route: `/` (Dashboard). Fixed left sidebar (224 px, unchanged — reuse existing `src/components/layout/Sidebar.jsx`).

Main column, top-to-bottom:

1. **TopBar** — page header with date/workspace, **ALL / IN PROGRESS / COMPLETE** segmented filter, search input, **+ New event** CTA.
2. **Top row** — two-column grid (`1fr 1.05fr`):
   - Left: **KPI rail** (3 tiles)
   - Right: **Workflow-state strip** (5 equal pipeline boxes)
3. **Events list** — single card containing date-grouped rows.

Container max-width: **1280 px**, horizontally centred. Vertical padding: 24 px. Inter-card gap: 20 px.

## Design Tokens

All tokens are pre-defined in `src/index.css` under `:root` as `--wr-*`. Use these — do not invent new colours.

| Token | Hex | Use |
|---|---|---|
| `--wr-bg-primary` | `#0D1B2A` | Page background |
| `--wr-bg-secondary` | `#121E2D` | Sidebar background |
| `--wr-bg-card` | `#1A2844` | Card surfaces |
| `--wr-bg-hover` | `#1F3060` | Row hover |
| `--wr-border` | `#2A3F5A` | Card borders, dividers |
| `--wr-text-primary` | `#E8EDF5` | Body text |
| `--wr-text-secondary` | `#8A9BB5` | Muted text |
| `--wr-text-muted` | `#546E7A` | Tertiary labels |
| `--wr-amber` | `#F0A500` | Primary accent (CTAs, active state) |
| `--wr-critical` | `#C0392B` | CRITICAL severity, live indicator |
| `--wr-high` | `#D68910` | HIGH severity, ROUND 2 status |
| `--wr-medium` | `#2E86AB` | MEDIUM severity, ROUND 1 status |
| `--wr-low` | `#27AE60` | LOW severity, COMPLETE status |
| `--wr-purple` | `#7B2D8B` | REVIEW status, geo domain |

Severity colour map:
- CRITICAL `#C0392B`
- HIGH `#D68910`
- MEDIUM `#2E86AB`
- LOW `#27AE60`

Status colour map:
- pending `#8A9BB5`
- round1 `#2E86AB`
- round2 `#D68910`
- review `#7B2D8B`
- complete `#27AE60`

Border radii: `rounded-md` (6 px) for cards; `rounded-sm` (2 px) for pipeline boxes and pills.

## Typography

- **Inter** (300/400/500/600/700) — UI default
- **JetBrains Mono** (400/500/600/700) — numbers, status pills, kickers, time, all-caps labels

Type sizes used:
- Card titles: 16 px semibold
- Event titles (in rows): 15 px semibold
- KPI numbers: 34 px bold, letter-spacing −0.02em, line-height 1
- Pipeline counts: 22 px bold mono
- Row meta (scenario, owner): 12 px regular
- Mono kickers / column heads: 10 px bold, letter-spacing 0.14–0.16em, uppercase
- Status pill labels: 10 px bold mono, letter-spacing 0.12em

## Components to Build

### 1. `TopBar`

Existing pattern from `Dashboard.jsx` — header row with logo block, title, subtitle, and right-aligned action cluster. Differences from the prior dashboard:

- **Filter pills** changed from time-ranges (24H / 7D / 14D / 30D) to **status filters**: `ALL`, `IN PROGRESS`, `COMPLETE`. Mono 10.5 px bold tracking 0.08em. Active pill: amber text on `rgba(240,165,0,0.1)` background.
- **Search input** with magnifier glyph, 220 px wide.
- **+ New event** primary button (amber background, dark text, semibold 14 px).

### 2. `KpiRail`

Single rounded card (`--wr-bg-card` over `--wr-border`). Inside: a 3-column grid (`repeat(3, 1fr)`) with right-borders between columns.

Each tile is a 3-row flex column with **explicit `min-height` on label (32 px) and value (42 px)** to align baselines across all three tiles regardless of label wrap. All three rows are centre-aligned (text-align center).

| Tile | Label | Value | Sub | Value colour |
|---|---|---|---|---|
| 1 | OPEN CRITICAL | `7` | `+3 / 7d` (green if up) | `--wr-critical` |
| 2 | AVG CONFIDENCE | `74%` | `+5pp` (green) | `--wr-low` |
| 3 | EVENTS THIS WEEK | `7` | `−1 / wk` (muted) | `--wr-amber` |

Padding: `px-5 py-5`; `px-3 py-3` when the `compactKpis` tweak is on.

### 3. `Pipeline` (Workflow-state strip)

Card with a small header row (kicker "WORKFLOW STATE" left, "{n} TOTAL" right, both 10 px mono muted).

Body: a flex row of **5 equal-width boxes** with `gap: 6px` between them. Each box must have `flex: 1 1 0` so they are exactly the same width regardless of count. Box has tinted background and 1px border in the stage colour:

```css
background: <stageColor>14;   /* alpha 0.08 */
border: 1px solid <stageColor>44;  /* alpha 0.27 */
border-radius: 2px;
padding: 12px;
```

Inside each box, centre-aligned:
- Stage label (9 px bold mono, letter-spacing 0.12em, coloured in the stage colour)
- Count (22 px bold mono, `--wr-text-primary`)

Stages in order: **PENDING · ROUND 1 · ROUND 2 · REVIEW · COMPLETE**, counts derived from filtering all events by `status`.

(Optional behind a tweak: switch sizing to count-proportional with `flex: <count> 1 0`, fallback minimum 0.65. Default is `equal`.)

### 4. `EventsList`

Single card, three sections:
- **Header row**: kicker "EVENTS" (amber 10 px mono), title `"{n} {filter-label} · sorted by date"`, right-aligned "ALL SESSIONS →" link.
- **Column header row**: 5 mono labels (TIME · EVENT · STATUS · FINDINGS · OWNER) + 1 empty cell for the chevron. **All centred** (`text-align: center`). 10 px bold mono, letter-spacing 0.14em, muted. Background tint `rgba(138,155,181,0.03)`.
- **Date groups**: `<DayGroup>` for `TODAY`, `UPCOMING`, `RECENT`. Empty groups render nothing.

Grid template for both column header and row: `80px 1fr 130px 110px 130px 18px`, gap 16 px, horizontal padding 24 px.

### 5. `DayGroup`

A bordered section header followed by `<EventRow>` children:

- Header bar: left has the all-caps label (e.g. `TODAY`) in mono 11 px bold tracking 0.16em (`--wr-text-secondary`) followed by a small sub-label in mono 10 px (e.g. `TUE · MAY 19`) muted. Right shows `{count} EVENTS` in mono 10 px muted. Padding `px-6 py-3`, background tint `rgba(138,155,181,0.025)`, bottom border.

Groups & sub-labels:
- **TODAY** — `TUE · MAY 19` (compute dynamically)
- **UPCOMING** — `NEXT 7 DAYS`
- **RECENT** — `LAST 14 DAYS`

### 6. `EventRow`

Anchor tag (`<a href={`/sessions/${e.id}`}>`) styled as a 6-column grid row.

Grid: `80px 1fr 130px 110px 130px 18px`, gap 16 px, `px-6 py-4` (compact: `py-2.5`, spacious: `py-5`), bottom border, last-child no border. Cursor pointer. Hover: `background: rgba(138,155,181,0.05)` and chevron animates `translateX(+2px)` and shifts colour to `--wr-amber`. Completed events render at `opacity: 0.78`.

Cell content:

| Col | Content | Alignment |
|---|---|---|
| TIME | `14 px mono semibold` time (HH:mm, e.g. `10:00`) + `9.5 px mono` `UTC` underneath, muted | Left |
| EVENT | 8 px severity dot (severity colour) → 15 px semibold title (truncate) → optional 6 px live-pulse dot (`--wr-critical`). Below: 12 px scenario subtitle, muted, truncated, indented 18 px (toggle via tweak) | Left |
| STATUS | `StatusPill` (see below) | **Centre** |
| FINDINGS | If 0: muted `—`. Else: 15 px mono bold count + 11 px muted "findings" + optional 10 px mono `{N}C` chip in critical-red for unresolved criticals | **Centre** |
| OWNER | 12 px mono in `--wr-text-secondary` | **Centre** |
| (last) | `→` chevron, 14 px mono, muted | Right |

### 7. `StatusPill`

Inline-flex span, 10 px bold mono, letter-spacing 0.12em, uppercase. Padding `px-2 py-0.5`, border-radius `rounded`, 1 px border, 0.08-alpha background tint, all in the status colour.

When `live === true`: prefix the label with `LIVE · ` and prepend a 5 px pulse-dot (`@keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.35} }` over 1.6s).

Labels: `PENDING`, `ROUND 1`, `ROUND 2`, `IN REVIEW`, `COMPLETE`.

## Interactions & Behavior

- **Top filter** (`ALL` / `IN PROGRESS` / `COMPLETE`) re-filters the events list. The grouping into TODAY/UPCOMING/RECENT happens *after* filtering. Empty groups are hidden entirely.
- **Event row click** → navigate to `/sessions/:id`. Use `useNavigate()` from react-router-dom; the prototype uses a plain `<a>` for demo purposes.
- **Hover state** — row background tints, chevron animates right by 2 px and turns amber. 140 ms ease.
- **Live indicator** — for sessions where `live === true`, the title gets a small red pulse-dot and the status pill prepends `LIVE · `. Animation: 1.6 s ease-in-out infinite.
- **All Sessions link** in the events-list header → `/sessions`.

## State Management

Component-local state only:
- `filter`: one of `ALL | IN PROGRESS | COMPLETE`.

Data dependencies (replace mock):
- Pull `sessions` via the existing `useWorkspace().db.sessions.list()` pattern.
- Map each session to an event object: `{ id, date, title, scenario, status, severity, findings, critical, owner, live }`.
  - `date` ← `session.created` (or scheduled-for if you add scheduling later)
  - `title` ← `session.name`
  - `scenario` ← lookup via `session.scenarioId` → `Scenario.name`
  - `status` ← `session.status` (existing enum maps cleanly to pending/round1/round2/review/complete)
  - `severity` ← max severity across `SessionFinding[]` for that session
  - `findings` ← count of findings
  - `critical` ← count of CRITICAL findings still open
  - `owner` ← lead agent name (or workspace owner if multi-agent)
  - `live` ← `session.status in (round1, round2)` and updated within last 5 min

KPI sources:
- `OPEN CRITICAL` = total CRITICAL findings with status ≠ resolved, across all in-flight sessions
- `AVG CONFIDENCE` = mean `SessionSynthesis.confidence` over the last 7 days
- `EVENTS THIS WEEK` = count of sessions created in the current ISO week
- Deltas compare to the prior equivalent window

Pipeline counts: simple groupby on `session.status`.

## Date Bucketing Logic

```js
const dayDelta = (d) => Math.round((startOfDay(d) - startOfDay(NOW)) / 86400000);
const today    = events.filter(e => dayDelta(e.date) === 0);
const upcoming = events.filter(e => dayDelta(e.date) > 0);
const recent   = events.filter(e => dayDelta(e.date) < 0);
// Today/Upcoming sort ascending by time; Recent sorts descending.
```

Time display uses 24h UTC: `HH:mm`. If the codebase shows local time elsewhere, match that convention but keep the `TIME` column to ≤ 5 chars.

## Tweakable Controls (Optional)

The prototype includes a Tweaks panel (`tweaks-panel.jsx`) exposing:
- Row density: compact / regular / spacious
- Pipeline boxes: equal / by count
- Compact KPI rail: on/off
- Show scenario subtitle: on/off
- Live pulse animation: on/off
- Accent colour picker (rewrites `--wr-amber`)

These are **prototype-only** — do not ship the tweaks panel in production. Pick the defaults and bake them in:
- density = regular
- pipelineSizing = equal
- compactKpis = false
- showScenarios = true
- showLivePulse = true

## Empty States

When the active filter returns zero events:
> "NO EVENTS MATCH THIS FILTER" — 11 px mono, letter-spacing 0.14em, muted, centred, 64 px vertical padding.

## What Changed vs. the Previous Dashboard

If the developer previously implemented the analyst-triage version (`design_handoff_analyst_dashboard`), this is a replacement, not an additional view. Remove these sections:

- `PriorityQueue` (the orange "Needs your attention" card)
- `FindingsMatrix` (severity × domain heatmap)
- `CoveragePanel` / `QuickActions` right-hand stack
- The "DESIGN REVIEW" explainer footer

Keep / refactor:
- `KpiStrip` — reduced from 5 tiles → **3 tiles**, with explicit row alignment
- New `Pipeline` strip replaces the matrix
- New `EventsList` (date-grouped) replaces the `SessionFeed` table

If the matrix and coverage views are still wanted, surface them under separate routes (`/threatmap` and `/domains` already exist) — don't crowd the home view.

## Files Included

```
design_handoff_dashboard_clean/
├── README.md                  ← this file
├── Dashboard Clean.html       ← the running prototype (open in a browser)
├── tweaks-panel.jsx           ← prototype tweak panel (do not port)
├── screenshots/
│   ├── 01-overview.png
│   ├── 02-full-page.png
│   ├── 03-filter-in-progress.png
│   ├── 04-filter-complete.png
│   └── 05-tweaks-open.png
└── src/
    ├── atoms.jsx              ← shared Card, Ico, AvatarStack, SevPill (reference patterns)
    ├── data.jsx               ← mock data shapes (reference structure only)
    └── sidebar.jsx            ← reuses existing AgentDebate Sidebar (already in codebase)
```

Open `Dashboard Clean.html` directly in a browser to run the prototype. All dependencies are loaded from CDNs (React 18.3.1, Babel standalone 7.29, Tailwind CDN).

## Production Implementation Notes

- Tailwind is loaded via CDN in the prototype. The real codebase already uses Tailwind via Vite — no change needed.
- All `<a href>` row links should be `<Link to={...}>` from `react-router-dom`.
- The prototype's `useState` filter persistence is per-mount. If you want it to survive navigation, lift to URL search params (`?filter=in-progress`).
- The Tweaks panel and its `__edit_mode_*` postMessage protocol are **design-tool infrastructure** — strip them on port.
- All inline `style={{...}}` blocks are for the prototype's clarity. Migrate them to Tailwind utilities or `cva`-style variants in the real codebase.
- The pulse-dot keyframe (`@keyframes pulseDot`) and `.row-link:hover .row-chev` rules need to be added to the global stylesheet or as Tailwind plugins.
