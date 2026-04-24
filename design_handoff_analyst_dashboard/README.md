# Handoff: Analyst Dashboard Redesign

## Overview

A redesign of the **AgentDebate Dashboard** (`src/pages/Dashboard.jsx`) focused on making it analyst-friendly and informative. The previous dashboard prioritised setup/onboarding and decorative stat rings; this version leads with triage (what needs attention now), surfaces debate-system-specific signals (R1→R2 severity drift, synthesis confidence, coverage gaps), and enriches every data row with the context analysts actually use.

## About the Design Files

The files in `Dashboard Improved.html` + `src/*.jsx` are **design references created in HTML/React+Babel** — a running prototype that demonstrates intended layout, behaviour, colours, typography, and interactions. **They are not production code to copy directly.**

Your task is to **re-implement this design inside the existing AgentDebate codebase** (React + Vite + Tailwind + shadcn/ui, WARROOM token system in `src/index.css`) by modifying `src/pages/Dashboard.jsx` and adding new components under `src/components/dashboard/`. Use the codebase's existing patterns: `Card`, `PageHeader`, the `useWorkspace()` hook, `parseAnalysisConfigs`, and the `--wr-*` CSS tokens already defined.

## Fidelity

**High-fidelity.** All colours, spacing, typography, and interactions are final. The mock data in `src/data.jsx` is illustrative — replace it by deriving equivalent shapes from the real entities (`Agent`, `Session`, `SessionAgent`, `SessionSynthesis`, `Scenario`, `Domain`, `AppConfig`) loaded via `useWorkspace().db`.

## Page Structure

Single route: `/` (Dashboard). Fixed left sidebar (224 px, unchanged from existing `Sidebar.jsx`). Main column has:

1. **TopBar** — page header with date/workspace, 24H/7D/14D/30D range selector, Filters button, New Session CTA.
2. **KPI strip** — 5 equal tiles in one card, severity-ordered.
3. **Priority queue** — full-width "Needs your attention" card.
4. **Two-column grid (1.55fr / 1fr):**
   - Left: Findings Matrix, then Session Feed
   - Right: Quick Actions, then Coverage & Workload panel

Remove the annotation callouts (`<Annotation>` in `src/app.jsx`) and the "Design Review" explainer card — those are presentation-only.

## Components to Build

### 1. `KpiStrip` (`src/components/dashboard/KpiStrip.jsx`)

5 tiles in a single bordered card, divided by `1px solid var(--wr-border)`.

Each tile shows, in a single row:
- **Label** (uppercase, 10.5 px, letter-spacing 0.08em, `--wr-text-secondary`)
- **Value** (JetBrains Mono, 28 px bold, `--wr-text-primary`, or severity colour if `severe && value > 0`)
- **Delta chip** (up/down arrow + value, green if "good direction", red otherwise)
- **14-point sparkline** on the right (72×28 px, with a 2 px dot at the final point and 12% opacity area fill)

Tiles (and their "good direction"):
| key | label | format | good |
|---|---|---|---|
| critical | Critical findings | count | down |
| open | Open findings | count | down |
| sessions | Sessions this week | count | up |
| conf | Avg. confidence | pct | up |
| drift | Median R1→R2 drift | signed float | down |

Critical tile shows a pulsing dot (`pulse-dot` keyframes, 1.6 s) top-right when value > 0. Tiles are buttons — clicking toggles the tile's filter on/off (persist in URL param `?kpi=critical`).

Data derivation:
- `critical` = count of `SessionAgent` where severity (round2_revised_severity || round1_severity) = CRITICAL, for sessions completed in range
- `open` = same but summing CRITICAL + HIGH + MEDIUM across completed sessions, minus any marked resolved
- `sessions` = count of sessions with `created_date` in range
- `conf` = mean synthesis confidence across sessions in range
- `drift` = median of (round2_revised_severity_ordinal − round1_severity_ordinal) where CRITICAL=3, HIGH=2, MEDIUM=1, LOW=0
- Sparkline buckets the range into 14 points (days for 14D/30D, hours for 24H, 12h chunks for 7D)

### 2. `PriorityQueue` (`src/components/dashboard/PriorityQueue.jsx`)

Full-width card. Header row: flame icon + "Needs your attention" + item-count pill + "All items →" link. Tab row below: `ALL · N`, `CRITICAL · N`, `HIGH · N`, `MEDIUM · N` (active tab uses severity colour at 18% bg + 50% border).

Each row has:
- 3 px severity-coloured left rail (full row height)
- 28×28 rounded tile with kind-icon, tinted with severity background (`SEV_BG`)
- Body: SevPill (compact) + KIND label + meta (e.g., "Session s01 · 14 min ago"), then bold title, then 12 px subtitle in `--wr-text-secondary`
- Right: 3-avatar stack (18 px), then amber-outlined action button with arrow

**Item kinds** (computed server-side, pick top ~5–8 by severity then recency):

| kind | when | action |
|---|---|---|
| `drift` | session has `abs(r2 − r1) ≥ 2` bands OR any critical drift upward | "Review rebuttals" → `/sessions/:id` |
| `unresolved` | session status ≠ complete AND count(CRITICAL findings) > 0 | "Adjudicate" → `/sessions/:id` |
| `gap` | domain has 0 assigned agents AND ≥1 active scenario references it | "Assign agents" → `/domains/:id` |
| `stale` | scenario freshness > 30 days AND status = active | "Re-run" → `/scenarios/:id` |
| `lowconf` | synthesis confidence < 0.65 AND ≥1 abstention | "Request re-debate" → `/sessions/:id` |

Empty state: diagonal-stripe bg (`.stripe` utility), "Inbox zero" + check icon.

### 3. `FindingsMatrix` (`src/components/dashboard/FindingsMatrix.jsx`)

Card. Header: "FINDINGS · SEVERITY × DOMAIN · LAST 14 DAYS" + total count + "Threat Map →" link.

Table with `border-collapse: separate; border-spacing: 2px`. Columns: **DOMAIN** (22%), **CRITICAL**, **HIGH**, **MEDIUM**, **LOW**, **TOTAL**, **14D TREND** (72 × 18 sparkline).

Domain cell: 3 × 16 px domain-colour rail + name + agent count. If `agents === 0`: name and agent count turn red (`--wr-critical`) with "⚠ 0 agents" label.

Severity cells: 36 px tall, rounded, fill opacity scales linearly with value (0.125 → 0.5 alpha over the max cell value). Text white if intensity > 0.5, else severity colour. Zero cells show `·` in muted text.

Footer row: "COL TOTAL" + per-severity totals in severity colours + grand total in amber, separated by top border.

### 4. `SessionFeed` (`src/components/dashboard/SessionFeed.jsx`)

Card. Header has title + inline tab pills (`ALL · N`, `ACTIVE · N`, `COMPLETE · N`) on the left, then search input (180 px, with search icon, `1px solid var(--wr-border)`) + "All sessions →" link on the right.

Subheader row (bg `rgba(138,155,181,0.03)`): column labels `NAME / SCENARIO`, `STATUS`, `FINDINGS`, `CONFIDENCE`, `DRIFT`, `AGENTS` — 10 px mono, tracking 0.1em, muted.

Grid template: `1fr 90px 110px 80px 80px 70px`. Per row:

- **Name/scenario:** bold session name + red pulse dot if `live`; below in muted: scenario name · `timeAgo(created)`
- **Status:** `StatusChip` (severity-coloured pill with pulse dot if live, "LIVE · R2" etc.). If active (round1/round2), show a 1 px progress bar below it, filled to `progress * 100%` in the status colour.
- **Findings:** big count + "findings" label; below: `{critical}C` in critical colour, `{high}H` in high colour
- **Confidence:** percentage, red if < 0.65
- **Drift:** up/down trend icon + signed float, red if > 0, green if < 0, dash if 0
- **Agents:** users icon + count, right-aligned

Row hover: bg `rgba(138,155,181,0.035)`.

### 5. `CoveragePanel` (`src/components/dashboard/CoveragePanel.jsx`)

Card. Header: "COVERAGE & WORKLOAD" + "Details →".

Top block: big mono number `{covered}/{total}` domains covered (green if no gaps, red otherwise) + right-side gap count warning.

Middle block: one bar per domain — 3 × 20 px domain-colour rail, name + "N agents" on the right. Progress bar below fills to `min(1, agents/3) * 100%` in domain colour. **Gap domains:** name and label turn critical red; bar fills 100% at 35% opacity in critical red.

Divider, then "TOP ANALYSTS · LAST 7D" section: top 5 agents by session count, each with a 20 px avatar, name + "N sess · XX%" on the right, and a 3 px progress bar filled proportionally in the agent's domain colour.

### 6. `QuickActions` (`src/components/dashboard/QuickActions.jsx`)

Card with 4 action rows. First row is primary (amber bg, dark text); others transparent with hover bg. Each row: 32 × 32 icon tile + label/subtitle + chevron.

Rows: "Start new session" (primary, → `/sessions/new`), "Live Debate Room" + NEW badge (→ `/sessions/new?mode=live`), "Generate brief" (→ `/reports`), "Chain Breaker" (→ `/chain-breaker`).

## Shared Atoms

Port from `src/atoms.jsx`:
- `Sparkline(data, color, width, height, fill)` — SVG path + area fill + dot at last point
- `SevPill({ sev, compact })` — colour-tinted severity badge
- `Delta({ value, good, format })` — green/red trend chip
- `Avatar({ name, size })` — gradient circle with initials (6 hues by initial char code)
- `AvatarStack({ names, max, size })` — overlapped avatars with `+N` overflow chip
- `Card`, `CardHeader({ title, right, sticky })`
- `timeAgo(iso)` — existing in `Dashboard.jsx`, keep

In the real codebase, replace the inline `<Ico name="...">` switch with `lucide-react` imports (it's already a dep). Icon map:

| Ico name | lucide |
|---|---|
| shield | Shield |
| flame | Flame |
| alert | AlertTriangle |
| clock | Clock |
| trend-u / trend-d | TrendingUp / TrendingDown |
| arrow-u / arrow-d / arrow-r | ArrowUp / ArrowDown / ArrowRight |
| users | Users |
| search | Search |
| plus | Plus |
| filter | Filter |
| bolt | Zap |
| swords | Swords |
| report | FileText |
| scissors | Scissors |
| dashboard | LayoutDashboard |
| bot | Bot |
| check | CheckCircle2 |
| chev-r / chev-d | ChevronRight / ChevronDown |

## Design Tokens (already in `src/index.css`)

```
--wr-bg-primary: #0D1B2A
--wr-bg-secondary: #121E2D
--wr-bg-card: #1A2844
--wr-bg-hover: #1F3060
--wr-border: #2A3F5A
--wr-border-strong: #3A5075   /* add this — new token used in focus rings */
--wr-text-primary: #E8EDF5
--wr-text-secondary: #8A9BB5
--wr-text-muted: #546E7A
--wr-amber: #F0A500
--wr-critical: #C0392B
--wr-high: #D68910
--wr-medium: #2E86AB
--wr-low: #27AE60
--wr-purple: #7B2D8B
```

Severity map (shared):
```js
const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SEV_BG    = { CRITICAL: 'rgba(192,57,43,0.14)', HIGH: 'rgba(214,137,16,0.14)', MEDIUM: 'rgba(46,134,171,0.14)', LOW: 'rgba(39,174,96,0.14)' };
```

Typography: Inter for text, JetBrains Mono for numbers / labels / hash-like IDs. Use `font-mono` utility.

Utility animations to add to `src/index.css`:
```css
@keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.pulse-dot { animation: pulseDot 1.6s ease-in-out infinite; }
.stripe { background-image: repeating-linear-gradient(45deg, rgba(138,155,181,0.04) 0 6px, transparent 6px 12px); }
```

## State & Data

- Keep the existing `useWorkspace()` hook + `loadData()` pattern from `Dashboard.jsx`. Fetch the same entities.
- Derive KPIs, priority items, matrix, coverage in `useMemo` hooks — see `src/data.jsx` for shape.
- Persist filter state (KPI filter, session feed tab, priority queue tab, range) to URL query params so analysts can deep-link / share views.
- Preserve the `parseAnalysisConfigs` call — `libMap`/`sesMap` feed analyses-analyzed count (surface somewhere if useful; currently not in the new layout — defer or drop).
- Setup guide: remove from dashboard entirely. The "Getting Started" flow should move to `/guide` (existing `UserGuide.jsx`), with an amber banner on the dashboard ONLY if `counts.domains === 0 || counts.agents === 0 || counts.scenarios === 0`, linking to the guide.

## Interactions

- **Tile click (KPIs):** filters the Priority Queue + Session Feed to that dimension (e.g., clicking "Critical" shows only priority items + sessions with criticals). Second click clears.
- **Priority row:** links to the entity (`/sessions/:id`, `/domains/:id`, `/scenarios/:id`).
- **Session row:** → `/sessions/:id`.
- **Range selector:** re-derives all KPI values, sparklines, and matrix. 14D matrix stays 14D regardless (it's a fixed lens).
- **Search in session feed:** fuzzy match on `session.name` + scenario name.
- **Hover states:** card rows subtle bg shift; no border glow.

## Accessibility

- All interactive rows must be real `<a>` or `<button>`, not `<div onClick>`.
- Severity colours pass AA on `--wr-bg-card` (#1A2844); re-verify HIGH + MEDIUM text on tinted cells (use white text when fill intensity > 0.5).
- Keyboard: Tab order top-to-bottom, left-to-right. KPI tiles get focus-visible amber ring.

## Files in This Bundle

- `Dashboard Improved.html` — entrypoint that loads the Babel-transpiled JSX below
- `src/data.jsx` — mock data shapes for every panel (treat as spec for the real data derivations)
- `src/atoms.jsx` — shared primitives (Sparkline, SevPill, Delta, Avatar, etc.)
- `src/sidebar.jsx` — existing sidebar reproduction (no changes needed from current `Sidebar.jsx`)
- `src/kpis.jsx` — KPI strip
- `src/priority.jsx` — Priority Queue
- `src/matrix.jsx` — Findings Matrix
- `src/feed.jsx` — Session Feed
- `src/coverage.jsx` — Coverage + Quick Actions
- `src/app.jsx` — top-level composition; the annotations + "Design Review" section are prototype-only, omit in production

## Out of Scope

- Real-time (websocket) updates to the LIVE session rows — nice-to-have; the `live` flag and pulse dot are already in place.
- Saved filter presets ("My Watchlist").
- Exporting the priority queue.
