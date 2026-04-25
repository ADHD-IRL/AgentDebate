import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Swords, Plus, Trash2, Radio, CheckCircle2, Circle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WrButton from '@/components/ui/WrButton';

const STATUS_CONFIG = {
  pending:  { color: '#546E7A', label: 'DRAFT',    draft: true  },
  round1:   { color: '#2E86AB', label: 'ROUND 1',  draft: false },
  round2:   { color: '#D68910', label: 'ROUND 2',  draft: false },
  complete: { color: '#27AE60', label: 'COMPLETE', draft: false },
};

const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SEV_KEYS  = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function ProgressStep({ done, active, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {done
        ? <CheckCircle2 style={{ width: 11, height: 11, color, flexShrink: 0 }} />
        : <Circle style={{ width: 11, height: 11, color: active ? color : 'var(--wr-border)', flexShrink: 0 }} />
      }
      <span style={{
        fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: done || active ? 700 : 400,
        color: done ? color : active ? color : 'var(--wr-text-muted)',
        letterSpacing: '0.06em',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function Sessions() {
  const { db } = useWorkspace();
  const [sessions,      setSessions]      = useState([]);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [syntheses,     setSyntheses]     = useState([]);
  const [domains,       setDomains]       = useState([]);
  const [scenarios,     setScenarios]     = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!db) return;
    // Load sessions first so the list always shows, even if enrichment fails
    db.Session.list('-created_date').then(s => {
      setSessions(s);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Enrichment data — failures are non-fatal
    Promise.allSettled([
      db.SessionAgent.list(),
      db.SessionSynthesis.list(),
      db.Domain.list(),
      db.Scenario.list(),
    ]).then(([sa, sy, d, sc]) => {
      if (sa.status === 'fulfilled') setSessionAgents(sa.value);
      if (sy.status === 'fulfilled') setSyntheses(sy.value);
      if (d.status  === 'fulfilled') setDomains(d.value);
      if (sc.status === 'fulfilled') setScenarios(sc.value);
    });
  }, [db]);

  const domainById   = id => domains.find(d => d.id === id);
  const scenarioById = id => scenarios.find(s => s.id === id);

  // Pre-group session_agents and syntheses by session_id
  const saBySession  = useMemo(() => {
    const m = {};
    for (const sa of sessionAgents) {
      if (!m[sa.session_id]) m[sa.session_id] = [];
      m[sa.session_id].push(sa);
    }
    return m;
  }, [sessionAgents]);

  const synthBySession = useMemo(() => {
    const m = {};
    for (const sy of syntheses) m[sy.session_id] = sy;
    return m;
  }, [syntheses]);

  const handleDelete = async (e, session) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete session "${session.name}"? This cannot be undone.`)) return;
    await db.Session.delete(session.id);
    setSessions(prev => prev.filter(s => s.id !== session.id));
  };

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Swords}
        title="SESSIONS"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        actions={
          <Link to="/sessions/new">
            <WrButton><Plus className="w-4 h-4" /> New Session</WrButton>
          </Link>
        }
      />

      {loading ? (
        <div className="p-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No sessions yet"
          description="A session runs your selected agents through a structured two-round analysis of any scenario."
          action={null}
        />
      ) : (
        <div className="p-6 space-y-2">
          {sessions.map(session => {
            const dom    = domainById(session.domain_id);
            const sc     = scenarioById(session.scenario_id);
            const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            const isDraft = status.draft;
            const isLive  = session.mode === 'live';

            const sas      = saBySession[session.id] || [];
            const synth    = synthBySession[session.id];
            const total    = sas.length;
            const r1Done   = sas.filter(sa => sa.round1_assessment).length;
            const r2Done   = sas.filter(sa => sa.round2_rebuttal).length;
            const hasSynth = !!synth?.raw_text;

            // Severity counts from actual assessments only
            const sevCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
            for (const sa of sas) {
              const sev = sa.round2_revised_severity || sa.round1_severity;
              if (sev && sevCounts[sev] !== undefined) sevCounts[sev]++;
            }
            const totalFindings = Object.values(sevCounts).reduce((a, b) => a + b, 0);
            const topSev        = SEV_KEYS.find(k => sevCounts[k] > 0) || null;

            // Overall progress 0–100
            const progressPct = isDraft ? 0
              : session.status === 'complete' ? 100
              : total > 0 ? Math.round(((r1Done + r2Done) / (total * 2)) * 80 + (hasSynth ? 20 : 0))
              : 0;

            const dest = isLive && !isDraft
              ? `/sessions/${session.id}/live`
              : `/sessions/${session.id}`;

            return (
              <Link
                key={session.id}
                to={dest}
                className="block rounded transition-all duration-150 hover:shadow-[0_0_16px_rgba(240,165,0,0.12)]"
                style={{
                  backgroundColor: isDraft ? 'var(--wr-bg-secondary)' : 'var(--wr-bg-card)',
                  border: isDraft ? '1px dashed var(--wr-border)' : '1px solid var(--wr-border)',
                  opacity: isDraft ? 0.78 : 1,
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                {/* Progress bar strip */}
                {!isDraft && (
                  <div style={{ height: 3, borderRadius: '4px 4px 0 0', backgroundColor: 'var(--wr-border)' }}>
                    <div style={{
                      height: '100%', width: `${progressPct}%`,
                      backgroundColor: status.color,
                      borderRadius: '4px 4px 0 0',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                )}

                <div className="p-4">
                  {/* Top row: name + badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm" style={{ color: isDraft ? 'var(--wr-text-secondary)' : 'var(--wr-text-primary)' }}>
                          {session.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded font-bold font-mono"
                          style={{
                            backgroundColor: `${status.color}22`,
                            color: status.color,
                            border: isDraft ? `1px dashed ${status.color}` : `1px solid ${status.color}44`,
                          }}>
                          {status.label}
                        </span>
                        {isLive && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                            style={{ backgroundColor: 'rgba(46,134,171,0.12)', color: '#2E86AB', border: '1px solid rgba(46,134,171,0.3)' }}>
                            {!isDraft && <Radio style={{ width: 8, height: 8 }} />}
                            LIVE
                          </span>
                        )}
                        {topSev && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold"
                            style={{ backgroundColor: `${SEV_COLOR[topSev]}22`, color: SEV_COLOR[topSev] }}>
                            {topSev}
                          </span>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--wr-text-muted)' }}>
                        {sc && <span>{sc.name}</span>}
                        {dom && (
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${dom.color}22`, color: dom.color }}>
                            {dom.name}
                          </span>
                        )}
                        {session.phase_focus && <span>· {session.phase_focus}</span>}
                        <span>{new Date(session.created_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Right: findings count */}
                    {totalFindings > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-base font-bold font-mono" style={{ color: topSev ? SEV_COLOR[topSev] : 'var(--wr-text-primary)', lineHeight: 1 }}>
                          {totalFindings}
                        </div>
                        <div className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>findings</div>
                      </div>
                    )}
                  </div>

                  {/* Bottom row: round progress + severity bars */}
                  {!isDraft && total > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3"
                      style={{ borderTop: '1px solid var(--wr-border)' }}>

                      {/* Round steps */}
                      <div className="flex items-center gap-4">
                        <ProgressStep
                          done={r1Done === total && total > 0}
                          active={r1Done > 0}
                          label={`R1 ${r1Done}/${total}`}
                          color="#2E86AB"
                        />
                        <ProgressStep
                          done={r2Done === total && total > 0}
                          active={r2Done > 0}
                          label={`R2 ${r2Done}/${total}`}
                          color="#D68910"
                        />
                        <ProgressStep
                          done={hasSynth}
                          active={false}
                          label="SYNTHESIS"
                          color="#27AE60"
                        />
                      </div>

                      {/* Severity mini-bars */}
                      {totalFindings > 0 && (
                        <div className="flex items-center gap-1">
                          {SEV_KEYS.filter(k => sevCounts[k] > 0).map(k => (
                            <span key={k} className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${SEV_COLOR[k]}22`, color: SEV_COLOR[k] }}>
                              {sevCounts[k]}{k[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button — must stop propagation so Link doesn't navigate */}
                <button
                  onClick={(e) => handleDelete(e, session)}
                  style={{ position: 'absolute', top: 12, right: 12, padding: 6, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#C0392B', opacity: 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  title="Delete session"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
