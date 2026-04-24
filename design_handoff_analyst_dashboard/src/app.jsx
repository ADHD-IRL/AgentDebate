// ── Main app: page header, filters bar, grid composition ───────────────────

function TopBar({ showAnnotations, setShowAnnotations, range, setRange }) {
  const ranges = ['24H', '7D', '14D', '30D'];
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-primary)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded flex items-center justify-center"
          style={{ backgroundColor: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)' }}>
          <Ico name="dashboard" size={16} style={{ color: 'var(--wr-amber)' }} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold tracking-[0.05em] font-mono" style={{ color: 'var(--wr-text-primary)' }}>
            Analyst Dashboard
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
            Friday, April 24, 2026 · 14:20 UTC · workspace <span className="font-mono" style={{ color: 'var(--wr-text-secondary)' }}>intel-primary</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Range selector */}
        <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className="font-mono text-[10.5px] font-bold tracking-[0.08em] px-2.5 py-1.5 transition-all"
              style={{
                color: range === r ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                backgroundColor: range === r ? 'rgba(240,165,0,0.1)' : 'transparent',
              }}>{r}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all"
          style={{ border: '1px solid var(--wr-border)', color: 'var(--wr-text-secondary)' }}>
          <Ico name="filter" size={12} />
          Filters
        </button>
        <button onClick={() => setShowAnnotations(!showAnnotations)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all font-mono"
          style={{
            border: `1px solid ${showAnnotations ? 'rgba(240,165,0,0.35)' : 'var(--wr-border)'}`,
            color: showAnnotations ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
            backgroundColor: showAnnotations ? 'rgba(240,165,0,0.08)' : 'transparent',
          }}>
          {showAnnotations ? 'HIDE NOTES' : 'SHOW NOTES'}
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
          <Ico name="plus" size={13} /> New Session
        </button>
      </div>
    </div>
  );
}

function Annotation({ top, left, right, text, point }) {
  const style = { top, left, right };
  return <div className="annot" style={style}>{point && '◀ '}{text}{!point && ' ▶'}</div>;
}

function App() {
  const [kpiFilter, setKpiFilter] = useState(null);
  const [range, setRange] = useState('7D');
  const [showAnnotations, setShowAnnotations] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('hide-annot', !showAnnotations);
  }, [showAnnotations]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <Sidebar />
      <div style={{ marginLeft: 224 }}>
        <TopBar
          showAnnotations={showAnnotations}
          setShowAnnotations={setShowAnnotations}
          range={range}
          setRange={setRange}
        />

        <div className="p-6 space-y-5 relative">

          {/* ── Row 1: KPI strip ──────────────────────────────────────────── */}
          <div className="relative">
            <KpiStrip filter={kpiFilter} setFilter={setKpiFilter} />
            {showAnnotations && (
              <Annotation top={-14} right={12}
                text="① KPIs replace vanity rings: deltas + 14d sparklines show direction, not just totals" />
            )}
          </div>

          {/* ── Row 2: Priority queue — full width ─────────────────────────── */}
          <div className="relative">
            <PriorityQueue />
            {showAnnotations && (
              <Annotation top={-14} left={12}
                text="② Priority queue surfaces drift, unresolved findings, coverage gaps — not just recent activity" />
            )}
          </div>

          {/* ── Row 3: 2-col split ─────────────────────────────────────────── */}
          <div className="grid gap-5" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
            <div className="space-y-5">
              <div className="relative">
                <FindingsMatrix />
                {showAnnotations && (
                  <Annotation top={-14} left={12}
                    text="③ Severity × domain heatmap — scannable, exposes gaps (Insider: 0 agents)" />
                )}
              </div>
              <div className="relative">
                <SessionFeed />
                {showAnnotations && (
                  <Annotation top={-14} left={12}
                    text="④ Session rows enriched with findings, confidence, R1→R2 drift + filters + search" />
                )}
              </div>
            </div>
            <div className="space-y-5">
              <div className="relative">
                <QuickActions />
                {showAnnotations && (
                  <Annotation top={-14} right={12} text="⑤ Actions, not setup" />
                )}
              </div>
              <div className="relative">
                <CoveragePanel />
                {showAnnotations && (
                  <Annotation top={-14} right={12}
                    text="⑥ Coverage + analyst workload — answers 'where am I thin?'" />
                )}
              </div>
            </div>
          </div>

          {/* ── Review summary (design note) ──────────────────────────────── */}
          <Card>
            <CardHeader title="DESIGN REVIEW · WHY THESE CHANGES" />
            <div className="p-5 grid gap-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { n: '01', title: 'Lead with what needs attention', body: 'The original dashboard led with setup progress and decorative rings. Analysts come back daily — they need a triage surface first: severity drift, unresolved criticals, coverage gaps, stale scenarios.' },
                { n: '02', title: 'Every number earns its place', body: 'Replaced "agents/10" percentage rings with KPIs that answer questions: how many open criticals, confidence trend, R1→R2 drift. Each paired with a 14-day sparkline and 7-day delta.' },
                { n: '03', title: 'Scannable density over empty space', body: 'The severity × domain matrix, the enriched session feed, and the coverage bars fit more analyst-relevant context in the same footprint — without hitting "data slop". Everything is filterable.' },
                { n: '04', title: 'Coverage is a first-class concern', body: 'Domains without agents are called out in red in both the matrix and the coverage panel. An analyst should never have to hunt to discover that Insider has 0 agents assigned.' },
                { n: '05', title: 'Drift is surfaced, not hidden', body: 'R1→R2 severity drift is a key debate-system signal. It now appears in priority items, in session rows, and as a top-level KPI. Upward drift on critical sessions is highlighted red.' },
                { n: '06', title: 'Setup guide moved out of the way', body: 'The getting-started guide still exists (under Help / User Guide) but no longer competes with daily work. Returning users see their workspace, not onboarding scaffolding.' },
              ].map(item => (
                <div key={item.n}>
                  <p className="font-mono text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--wr-amber)' }}>{item.n}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--wr-text-primary)' }}>{item.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
