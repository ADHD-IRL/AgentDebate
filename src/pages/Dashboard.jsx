import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { parseAnalysisConfigs } from '@/lib/chainBreakStorage';
import {
  Bot, Swords, Link2, Target, Plus, ArrowRight,
  Globe, Shield, CheckCircle2,
  FileText, Scissors, BarChart3, Map, ChevronRight,
  Play, TrendingUp, BookOpen, Zap,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const GUIDE_KEY = 'agentdebate_guide_open';

const STEPS = [
  {
    num: 1, key: 'domains', icon: Globe, color: '#2E86AB',
    title: 'Map Your Threat Landscape',
    description: 'Create domains to organise your threat environment — cyber, physical, geopolitical, OSINT, or any area relevant to your assessment.',
    to: '/domains', actionLabel: 'Set up domains',
    check: c => c.domains > 0,
    doneText: c => `${c.domains} domain${c.domains !== 1 ? 's' : ''} configured`,
    requiresSteps: [],
  },
  {
    num: 2, key: 'agents', icon: Bot, color: '#7B2D8B',
    title: 'Add Analyst Agents',
    description: 'Agents bring different analytical lenses to your assessment. Add at least one specialist per domain you want covered.',
    to: '/agents', actionLabel: 'Add agents',
    check: c => c.agents > 0,
    doneText: c => `${c.agents} agent${c.agents !== 1 ? 's' : ''} ready`,
    requiresSteps: [],
  },
  {
    num: 3, key: 'scenarios', icon: Target, color: '#27AE60',
    title: 'Define a Threat Scenario',
    description: "A scenario provides the threat context — who the actor is, what they're targeting, and under what conditions.",
    to: '/scenarios', actionLabel: 'Create a scenario',
    check: c => c.scenarios > 0,
    doneText: c => `${c.scenarios} scenario${c.scenarios !== 1 ? 's' : ''} available`,
    requiresSteps: [],
  },
  {
    num: 4, key: 'session', icon: Swords, color: '#F0A500',
    title: 'Run a Threat Assessment',
    description: 'Start a session to bring your agents together. They score threats, challenge each other through structured debate rounds, and produce a synthesised assessment.',
    to: '/sessions/new', actionLabel: 'Start a session',
    check: c => c.startedSessions > 0,
    doneText: c => `${c.startedSessions} session${c.startedSessions !== 1 ? 's' : ''} run`,
    requiresSteps: [1, 2, 3],
  },
  {
    num: 5, key: 'review', icon: FileText, color: '#546E7A',
    title: 'Review & Export Findings',
    description: 'Once a session completes, review the synthesised threat findings across all agents and domains.',
    to: '/reports', actionLabel: 'View reports',
    check: c => c.completeSessions > 0,
    doneText: () => 'Findings available',
    requiresSteps: [4],
  },
];

const TRACK_STEPS = [
  { label: 'PEND', color: '#546E7A' },
  { label: 'R1',   color: '#2E86AB' },
  { label: 'R2',   color: '#D68910' },
  { label: 'SYN',  color: '#27AE60' },
];

const STATUS_TO_STEP = { pending: 0, round1: 1, round2: 2, complete: 3 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

// ── RingMini ──────────────────────────────────────────────────────────────────

function RingMini({ pct, color, size = 48, centerLabel }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const sw = Math.max(4, size * 0.14);
  const offset = circ * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--wr-bg-secondary)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={pct > 0 ? offset : circ} />
      </svg>
      {centerLabel !== undefined && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.24, fontFamily: 'monospace', fontWeight: 700, color: 'var(--wr-text-primary)', lineHeight: 1 }}>
            {centerLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── MiniProgressTrack ─────────────────────────────────────────────────────────

function MiniProgressTrack({ status }) {
  const activeStep = STATUS_TO_STEP[status] ?? 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      {TRACK_STEPS.map((step, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          backgroundColor: i <= activeStep ? step.color : 'transparent',
          border: `1.5px solid ${i <= activeStep ? step.color : 'var(--wr-border)'}`,
        }} />
      ))}
    </div>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────

function SessionCard({ session }) {
  const activeStep = STATUS_TO_STEP[session.status] ?? 0;
  const lineFillPct = (activeStep / 3) * 75;

  return (
    <Link to={`/sessions/${session.id}`} className="block">
      <div className="rounded-lg p-3 transition-all"
        style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,165,0,0.3)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(240,165,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--wr-border)'; e.currentTarget.style.boxShadow = 'none'; }}>

        <div className="flex items-start justify-between mb-3">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--wr-text-primary)' }}>{session.name}</p>
            {session.phase_focus && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{session.phase_focus}</p>
            )}
          </div>
          <span className="text-xs flex-shrink-0 ml-3" style={{ color: 'var(--wr-text-muted)' }}>{timeAgo(session.created_date)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: '12.5%', right: '12.5%', height: 1, backgroundColor: 'var(--wr-border)' }} />
          <div style={{ position: 'absolute', top: 10, left: '12.5%', height: 1, width: `${lineFillPct}%`, backgroundColor: TRACK_STEPS[activeStep].color, transition: 'width 0.4s ease' }} />
          {TRACK_STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            const locked = i > activeStep;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: locked ? 'var(--wr-bg-primary)' : step.color,
                  border: locked ? '1.5px solid var(--wr-border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 8px ${step.color}60` : 'none',
                }}>
                  {done   && <CheckCircle2 style={{ width: 11, height: 11, color: '#0D1B2A' }} />}
                  {active && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0D1B2A' }} />}
                </div>
                <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 600, marginTop: 3, color: locked ? 'var(--wr-text-muted)' : step.color }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

// ── WorkflowStep ──────────────────────────────────────────────────────────────

function WorkflowStep({ step, counts, isDone, isActive, isLocked }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-3 py-3 px-4 border-b last:border-0"
      style={{ borderColor: 'var(--wr-border)', backgroundColor: isActive ? `${step.color}08` : 'transparent', opacity: isLocked ? 0.4 : 1 }}>
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
          style={{
            backgroundColor: isDone ? 'rgba(39,174,96,0.12)' : isActive ? `${step.color}18` : 'rgba(84,110,122,0.1)',
            border: `1.5px solid ${isDone ? '#27AE60' : isActive ? step.color : 'rgba(84,110,122,0.3)'}`,
            color: isDone ? '#27AE60' : isActive ? step.color : '#546E7A',
          }}>
          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.num}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold leading-tight" style={{ color: isDone ? 'var(--wr-text-muted)' : 'var(--wr-text-primary)' }}>
              {step.title}
            </p>
            {isDone
              ? <p className="text-xs mt-0.5 font-medium" style={{ color: '#27AE60' }}>✓ {step.doneText(counts)}</p>
              : <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--wr-text-muted)' }}>{isLocked ? 'Complete the steps above first.' : step.description}</p>
            }
          </div>
          {!isDone && !isLocked && (
            <Link to={step.to}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: isActive ? step.color : 'transparent', color: isActive ? '#fff' : 'var(--wr-text-muted)', border: isActive ? `1px solid ${step.color}` : '1px solid var(--wr-border)' }}>
              {step.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          )}
          {isDone && (
            <Link to={step.to} className="flex-shrink-0 text-xs hover:opacity-70" style={{ color: 'var(--wr-text-muted)' }}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { db } = useWorkspace();
  const navigate = useNavigate();

  const [guideOpen, setGuideOpen] = useState(() => {
    const stored = localStorage.getItem(GUIDE_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    agents: [], sessions: [], chains: [], scenarios: [], domains: [],
    sessionAgents: [], syntheses: [], libMap: {}, sesMap: {},
  });

  const loadData = useCallback(() => {
    if (!db) return;
    Promise.all([
      db.Agent.list(), db.Session.list(), db.Chain.list(), db.Scenario.list(),
      db.Domain.list(), db.SessionAgent.list(), db.SessionSynthesis.list(), db.AppConfig.list(),
    ]).then(([agents, sessions, chains, scenarios, domains, sessionAgents, syntheses, configs]) => {
      const { libMap, sesMap } = parseAnalysisConfigs(configs);
      setData({ agents, sessions, chains, scenarios, domains, sessionAgents, syntheses, libMap, sesMap });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [db]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  const toggleGuide = () => {
    setGuideOpen(prev => { const next = !prev; localStorage.setItem(GUIDE_KEY, String(next)); return next; });
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const activeSessions   = useMemo(() => data.sessions.filter(s => ['round1','round2'].includes(s.status)), [data.sessions]);
  const completeSessions = useMemo(() => data.sessions.filter(s => s.status === 'complete'), [data.sessions]);

  const recentSessions = useMemo(() => {
    const active = activeSessions.slice().sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    const rest = data.sessions.filter(s => !['round1','round2'].includes(s.status))
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    return [...active, ...rest].slice(0, 6);
  }, [data.sessions, activeSessions]);

  const completedSessionIds = useMemo(() => new Set(completeSessions.map(s => s.id)), [completeSessions]);

  const findings = useMemo(() => {
    const completed = data.sessionAgents.filter(sa => completedSessionIds.has(sa.session_id));
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const sa of completed) {
      const sev = sa.round2_revised_severity || sa.round1_severity;
      if (counts[sev] !== undefined) counts[sev]++;
    }
    return { ...counts, total: completed.length };
  }, [data.sessionAgents, completedSessionIds]);

  const totalAnalyzed = useMemo(() => Object.keys(data.libMap).length + Object.keys(data.sesMap).length, [data.libMap, data.sesMap]);

  const counts = useMemo(() => ({
    domains: data.domains.length, agents: data.agents.length,
    scenarios: data.scenarios.length, chains: data.chains.length,
    sessions: data.sessions.length,
    startedSessions: data.sessions.filter(s => s.status !== 'pending').length,
    completeSessions: completeSessions.length,
  }), [data, completeSessions]);

  const stepStates = useMemo(() =>
    STEPS.map(step => {
      const isDone   = step.check(counts);
      const reqsMet  = (step.requiresSteps || []).every(n => STEPS[n - 1].check(counts));
      const isLocked = !isDone && !reqsMet;
      const isActive = !isDone && reqsMet;
      return { isDone, isActive, isLocked };
    }), [counts]);

  const allStepsDone   = stepStates.every(s => s.isDone);
  const doneCount      = stepStates.filter(s => s.isDone).length;
  const currentStepNum = stepStates.findIndex(s => s.isActive) + 1;
  const isReady        = counts.domains > 0 && counts.agents > 0 && counts.scenarios > 0;

  const activeScenarioCount = data.scenarios.filter(s => s.status === 'active').length || data.scenarios.length;
  const sessionsPct  = counts.sessions  > 0 ? counts.completeSessions / counts.sessions  : 0;
  const agentsPct    = Math.min(1, counts.agents / 10);
  const scenariosPct = counts.scenarios > 0 ? activeScenarioCount / counts.scenarios : 0;

  const Skeleton = ({ h = 'h-32' }) => (
    <div className={`${h} rounded-lg animate-pulse`} style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }} />
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <PageHeader
        icon={Shield}
        title="AgentDebate"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={toggleGuide}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
              style={{ backgroundColor: guideOpen ? 'rgba(240,165,0,0.1)' : 'transparent', color: guideOpen ? 'var(--wr-amber)' : 'var(--wr-text-muted)', border: `1px solid ${guideOpen ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}` }}>
              <BookOpen className="w-3.5 h-3.5" />
              {guideOpen ? 'Hide Guide' : 'Setup Guide'}
              {!guideOpen && currentStepNum > 0 && (
                <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ml-0.5" style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                  {currentStepNum}
                </span>
              )}
            </button>
            <Link to="/sessions/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all" style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                <Plus className="w-4 h-4" /> New Session
              </button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-5">

          {/* ── LEFT 2/3 ──────────────────────────────────────────────────────── */}
          <div className="col-span-2 space-y-5">

            {/* Stat rings row */}
            {loading ? <Skeleton h="h-28" /> : (
              <div className="rounded-lg overflow-hidden flex" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                {[
                  { to: '/sessions', pct: sessionsPct, color: '#2E86AB', label: 'Sessions', sub: counts.sessions === 0 ? 'None yet' : `${activeSessions.length} active · ${counts.completeSessions} done`, center: counts.sessions || '+' },
                  { to: '/agents',   pct: agentsPct,   color: '#7B2D8B', label: 'Analysts',  sub: counts.agents === 0 ? 'None added' : `across ${counts.domains} domain${counts.domains !== 1 ? 's' : ''}`, center: counts.agents || '+' },
                  { to: '/scenarios',pct: scenariosPct,color: '#27AE60', label: 'Scenarios', sub: counts.scenarios === 0 ? 'None created' : `${activeScenarioCount} active`, center: counts.scenarios || '+' },
                ].map(({ to, pct, color, label, sub, center }, idx, arr) => (
                  <Link key={to} to={to} className="flex-1 flex flex-col items-center py-5 px-4 transition-all hover:brightness-110"
                    style={{ borderRight: idx < arr.length - 1 ? '1px solid var(--wr-border)' : 'none' }}>
                    <RingMini pct={pct} color={color} size={52} centerLabel={center} />
                    <p className="text-xs font-semibold mt-2" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
                    <p className="text-xs mt-0.5 text-center" style={{ color: 'var(--wr-text-muted)' }}>{sub}</p>
                  </Link>
                ))}
                {/* Findings cell */}
                <Link to="/reports" className="flex-1 flex flex-col items-center py-5 px-4 transition-all hover:brightness-110"
                  style={{ borderLeft: '1px solid var(--wr-border)' }}>
                  {findings.total > 0 ? (
                    <>
                      <p className="text-2xl font-bold font-mono" style={{ color: findings.CRITICAL > 0 ? SEV_COLOR.CRITICAL : findings.HIGH > 0 ? SEV_COLOR.HIGH : 'var(--wr-text-primary)' }}>{findings.total}</p>
                      <div className="w-full h-2 rounded-full overflow-hidden flex my-2" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
                        {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => findings[sev] > 0 && (
                          <div key={sev} style={{ width: `${(findings[sev]/findings.total)*100}%`, backgroundColor: SEV_COLOR[sev], height: '100%' }} />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--wr-text-secondary)' }}>Findings</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{findings.CRITICAL} critical · {findings.HIGH} high</p>
                    </>
                  ) : (
                    <>
                      <RingMini pct={0} color="#D68910" size={52} centerLabel="–" />
                      <p className="text-xs font-semibold mt-2" style={{ color: 'var(--wr-text-secondary)' }}>Findings</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>From completed sessions</p>
                    </>
                  )}
                </Link>
              </div>
            )}

            {/* Active sessions strip */}
            {!loading && activeSessions.length > 0 && (
              <div className="rounded-lg px-4 py-2.5 flex items-center justify-between"
                style={{ backgroundColor: 'rgba(46,134,171,0.06)', border: '1px solid rgba(46,134,171,0.25)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#2E86AB' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2E86AB' }}>
                    {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''} in progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeSessions.slice(0, 2).map(s => (
                    <Link key={s.id} to={`/sessions/${s.id}`}
                      className="text-xs px-2.5 py-1 rounded truncate max-w-[130px] hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'rgba(46,134,171,0.1)', border: '1px solid rgba(46,134,171,0.3)', color: '#2E86AB' }}>
                      {s.name}
                    </Link>
                  ))}
                  {activeSessions.length > 2 && (
                    <Link to="/sessions" className="text-xs" style={{ color: '#2E86AB' }}>+{activeSessions.length - 2} more →</Link>
                  )}
                </div>
              </div>
            )}

            {/* Session cards */}
            {loading ? <Skeleton h="h-64" /> : (
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--wr-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Sessions</p>
                  <Link to="/sessions" className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--wr-amber)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {recentSessions.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Swords className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--wr-amber)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--wr-text-secondary)' }}>No sessions yet</p>
                    <p className="text-xs mb-4" style={{ color: 'var(--wr-text-muted)' }}>
                      {isReady ? 'Your workspace is ready — start your first session.' : 'Complete the setup guide, then start a session.'}
                    </p>
                    {isReady && (
                      <Link to="/sessions/new">
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold" style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                          <Plus className="w-3.5 h-3.5" /> New Session
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2" style={{ maxHeight: recentSessions.length > 4 ? 480 : 'none', overflowY: recentSessions.length > 4 ? 'auto' : 'visible' }}>
                    {recentSessions.map(s => <SessionCard key={s.id} session={s} />)}
                  </div>
                )}
              </div>
            )}

            {/* Threat findings bar */}
            {!loading && completeSessions.length > 0 && findings.total > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--wr-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Threat Findings</p>
                  <Link to="/reports" className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--wr-amber)' }}>
                    Full report <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-5 py-4 flex items-center gap-6">
                  <div style={{ flex: '0 0 45%' }}>
                    <div className="w-full h-3 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => findings[sev] > 0 && (
                        <div key={sev} style={{ width: `${(findings[sev]/findings.total)*100}%`, backgroundColor: SEV_COLOR[sev] }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                      {findings.total} findings across {completeSessions.length} session{completeSessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-5">
                    {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => (
                      <div key={sev}>
                        <p className="text-lg font-bold font-mono" style={{ color: SEV_COLOR[sev] }}>{findings[sev]}</p>
                        <p className="text-xs font-bold font-mono" style={{ color: SEV_COLOR[sev], opacity: 0.7 }}>{sev}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>{/* end left col */}

          {/* ── RIGHT 1/3 ─────────────────────────────────────────────────────── */}
          <div className="col-span-1 space-y-3">

            {/* Action buttons — always visible */}
            <Link to="/sessions/new" className="block">
              <div className="rounded-lg p-4 transition-all hover:opacity-90" style={{ backgroundColor: 'var(--wr-amber)', cursor: 'pointer' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0D1B2A' }}>Start New Session</p>
                    <p className="text-xs mt-0.5" style={{ color: '#0D1B2A', opacity: 0.65 }}>Structured threat assessment</p>
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                    <Swords className="w-4 h-4" style={{ color: '#0D1B2A' }} />
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/sessions/new?mode=live" className="block">
              <div className="rounded-lg p-4 transition-all hover:opacity-90" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid rgba(240,165,0,0.35)', cursor: 'pointer' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold" style={{ color: 'var(--wr-amber)' }}>Live Debate Room</p>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>NEW</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Real-time streaming debate</p>
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)' }}>
                    <Zap className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Guide panel (toggle-able) */}
            {guideOpen ? (
              loading ? <Skeleton h="h-80" /> : (
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--wr-border)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>{allStepsDone ? 'Workflow Complete' : 'Getting Started'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{allStepsDone ? 'Workspace fully configured' : 'Follow these steps to begin'}</p>
                    </div>
                    {allStepsDone
                      ? <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: '#27AE60' }} /><span className="text-xs font-semibold" style={{ color: '#27AE60' }}>All done</span></div>
                      : <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{doneCount} / {STEPS.length}</span>
                    }
                  </div>
                  {!allStepsDone && (
                    <div className="px-4 pt-2.5 pb-1">
                      <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
                        <div className="h-1 rounded-full transition-all" style={{ backgroundColor: 'var(--wr-amber)', width: `${(doneCount / STEPS.length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div>
                    {STEPS.map((step, i) => (
                      <WorkflowStep key={step.key} step={step} counts={counts} isDone={stepStates[i].isDone} isActive={stepStates[i].isActive} isLocked={stepStates[i].isLocked} />
                    ))}
                  </div>
                  {isReady && !allStepsDone && (
                    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(39,174,96,0.05)', borderTop: '1px solid rgba(39,174,96,0.2)' }}>
                      <p className="text-sm" style={{ color: '#27AE60' }}>Ready to start</p>
                      <Link to="/sessions/new">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold" style={{ backgroundColor: '#27AE60', color: '#fff' }}>
                          <Play className="w-3.5 h-3.5" /> Start
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Operations summary */
              <>
                {/* Workspace readiness */}
                {loading ? <Skeleton h="h-44" /> : (
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                    <p className="px-4 py-3 text-xs font-bold tracking-widest font-mono border-b" style={{ color: 'var(--wr-text-muted)', borderColor: 'var(--wr-border)' }}>WORKSPACE</p>
                    {[
                      { to: '/domains',   icon: Globe,  label: 'Threat Domains', count: counts.domains,   color: '#2E86AB' },
                      { to: '/agents',    icon: Bot,    label: 'Analyst Agents', count: counts.agents,    color: '#7B2D8B' },
                      { to: '/scenarios', icon: Target, label: 'Scenarios',      count: counts.scenarios, color: '#27AE60' },
                      { to: '/chains',    icon: Link2,  label: 'Threat Chains',  count: counts.chains,    color: '#F0A500' },
                    ].map(({ to, icon: Icon, label, count, color }) => (
                      <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110 group border-b last:border-0" style={{ borderColor: 'var(--wr-border)' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: count > 0 ? '#27AE60' : 'var(--wr-amber)' }} />
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-3 h-3" style={{ color }} />
                        </div>
                        <p className="flex-1 text-xs font-medium" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
                        <span className="text-sm font-bold font-mono" style={{ color: count > 0 ? color : 'var(--wr-text-muted)' }}>{count}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--wr-text-muted)' }} />
                      </Link>
                    ))}
                    {[counts.domains, counts.agents, counts.scenarios].some(c => c === 0) && (
                      <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(240,165,0,0.05)', borderTop: '1px solid rgba(240,165,0,0.15)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--wr-amber)' }} />
                        <p className="text-xs flex-1" style={{ color: 'var(--wr-amber)' }}>Setup incomplete</p>
                        <button onClick={() => { setGuideOpen(true); localStorage.setItem(GUIDE_KEY, 'true'); }} className="text-xs hover:opacity-80" style={{ color: 'var(--wr-amber)', textDecoration: 'underline' }}>Show guide</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Findings snapshot OR analysis tools */}
                {loading ? <Skeleton h="h-36" /> : findings.total > 0 ? (
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--wr-border)' }}>
                      <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>FINDINGS</p>
                      <Link to="/reports" className="text-xs hover:opacity-70" style={{ color: 'var(--wr-amber)' }}>View report →</Link>
                    </div>
                    <div className="px-4 py-3">
                      <div className="w-full h-2 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
                        {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => findings[sev] > 0 && (
                          <div key={sev} style={{ width: `${(findings[sev]/findings.total)*100}%`, backgroundColor: SEV_COLOR[sev] }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        {['CRITICAL','HIGH','MEDIUM','LOW'].map(sev => (
                          <div key={sev} className="text-center">
                            <p className="text-sm font-bold font-mono" style={{ color: SEV_COLOR[sev] }}>{findings[sev]}</p>
                            <p style={{ fontSize: 9, fontFamily: 'monospace', color: SEV_COLOR[sev], opacity: 0.7 }}>{sev.slice(0,4)}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{findings.total} total from {completeSessions.length} session{completeSessions.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                    <p className="px-4 py-3 text-xs font-bold tracking-widest font-mono border-b" style={{ color: 'var(--wr-text-muted)', borderColor: 'var(--wr-border)' }}>ANALYSIS TOOLS</p>
                    {[
                      { to: '/reports',         icon: FileText,  label: 'Reports',         color: '#546E7A' },
                      { to: '/chain-breaker',   icon: Scissors,  label: 'Chain Breaker',   color: '#C0392B' },
                      { to: '/threatmap',       icon: Map,       label: 'Threat Map',      color: '#2E86AB' },
                      { to: '/agent-analytics', icon: BarChart3, label: 'Agent Analytics', color: '#7B2D8B' },
                    ].map(({ to, icon: Icon, label, color }) => (
                      <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110 group border-b last:border-0" style={{ borderColor: 'var(--wr-border)' }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-3 h-3" style={{ color }} />
                        </div>
                        <p className="flex-1 text-xs font-medium" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--wr-text-muted)' }} />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Recent sessions */}
                {loading ? <Skeleton h="h-40" /> : (
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--wr-border)' }}>
                      <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>RECENT SESSIONS</p>
                      <Link to="/sessions" className="text-xs hover:opacity-70" style={{ color: 'var(--wr-amber)' }}>View all →</Link>
                    </div>
                    {recentSessions.length === 0 ? (
                      <div className="px-4 py-5 text-center space-y-1">
                        <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>No sessions yet</p>
                        <Link to="/sessions/new" className="text-xs hover:opacity-70" style={{ color: 'var(--wr-amber)' }}>New Session →</Link>
                      </div>
                    ) : (
                      recentSessions.slice(0, 3).map(s => (
                        <Link key={s.id} to={`/sessions/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110 border-b last:border-0" style={{ borderColor: 'var(--wr-border)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--wr-text-secondary)' }}>{s.name}</p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: { pending:'#546E7A', round1:'#2E86AB', round2:'#D68910', complete:'#27AE60' }[s.status] || '#546E7A' }}>
                              {s.status?.toUpperCase()}
                            </p>
                          </div>
                          <MiniProgressTrack status={s.status} />
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

          </div>{/* end right col */}
        </div>
      </div>
    </div>
  );
}





