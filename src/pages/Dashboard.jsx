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

const SESSION_STATUS = {
  pending:  { label: 'Pending',  color: '#546E7A', bg: 'rgba(84,110,122,0.12)' },
  round1:   { label: 'Round 1',  color: '#2E86AB', bg: 'rgba(46,134,171,0.12)' },
  round2:   { label: 'Round 2',  color: '#D68910', bg: 'rgba(214,137,16,0.12)' },
  complete: { label: 'Complete', color: '#27AE60', bg: 'rgba(39,174,96,0.12)'  },
};

const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const GUIDE_KEY = 'warroom_guide_open';

// ── Workflow steps ─────────────────────────────────────────────────────────────

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
    description: "A scenario provides the threat context — who the actor is, what they're targeting, and under what conditions. Agents assess threats within this framing.",
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
    description: 'Once a session completes, review the synthesised threat findings across all agents and domains. Export reports for stakeholders.',
    to: '/reports', actionLabel: 'View reports',
    check: c => c.completeSessions > 0,
    doneText: () => 'Findings available',
    requiresSteps: [4],
  },
];

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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const inner = (
    <div className="rounded-lg p-4 h-full"
      style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-2xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{value}</span>
      </div>
      <p className="text-xs font-semibold" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{sub}</p>}
    </div>
  );
  return to ? <Link to={to} className="block hover:opacity-90 transition-opacity">{inner}</Link> : inner;
}

function WorkflowStep({ step, counts, isDone, isActive, isLocked }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-4 py-4 px-5 border-b last:border-0 transition-colors"
      style={{
        borderColor: 'var(--wr-border)',
        backgroundColor: isActive ? `${step.color}08` : 'transparent',
        opacity: isLocked ? 0.4 : 1,
      }}>
      {/* Number badge */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono"
          style={{
            backgroundColor: isDone ? 'rgba(39,174,96,0.12)' : isActive ? `${step.color}18` : 'rgba(84,110,122,0.1)',
            border: `1.5px solid ${isDone ? '#27AE60' : isActive ? step.color : 'rgba(84,110,122,0.3)'}`,
            color: isDone ? '#27AE60' : isActive ? step.color : '#546E7A',
          }}>
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.num}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight"
              style={{ color: isDone ? 'var(--wr-text-muted)' : 'var(--wr-text-primary)' }}>
              {step.title}
            </p>
            {isDone ? (
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#27AE60' }}>
                ✓ {step.doneText(counts)}
              </p>
            ) : (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--wr-text-muted)' }}>
                {isLocked ? 'Complete the steps above first.' : step.description}
              </p>
            )}
          </div>

          {!isDone && !isLocked && (
            <Link to={step.to}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-80"
              style={{
                backgroundColor: isActive ? step.color : 'transparent',
                color: isActive ? '#fff' : 'var(--wr-text-muted)',
                border: isActive ? `1px solid ${step.color}` : '1px solid var(--wr-border)',
              }}>
              {step.actionLabel} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {isDone && (
            <Link to={step.to}
              className="flex-shrink-0 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--wr-text-muted)' }}>
              Edit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session }) {
  const s = SESSION_STATUS[session.status] || SESSION_STATUS.pending;
  const isActive = ['round1', 'round2'].includes(session.status);
  return (
    <Link to={`/sessions/${session.id}`}
      className="flex items-center gap-3 px-5 py-3 transition-all hover:brightness-110 group"
      style={{ borderBottom: '1px solid var(--wr-border)' }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: s.color, boxShadow: isActive ? `0 0 6px ${s.color}` : 'none' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{session.name}</p>
        {session.phase_focus && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{session.phase_focus}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {session.created_date && (
          <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{timeAgo(session.created_date)}</span>
        )}
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--wr-text-muted)' }} />
      </div>
    </Link>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { db }   = useWorkspace();
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
      db.Agent.list(),
      db.Session.list(),
      db.Chain.list(),
      db.Scenario.list(),
      db.Domain.list(),
      db.SessionAgent.list(),
      db.SessionSynthesis.list(),
      db.AppConfig.list(),
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
    setGuideOpen(prev => {
      const next = !prev;
      localStorage.setItem(GUIDE_KEY, String(next));
      return next;
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeSessions   = useMemo(() => data.sessions.filter(s => ['round1', 'round2'].includes(s.status)), [data.sessions]);
  const completeSessions = useMemo(() => data.sessions.filter(s => s.status === 'complete'), [data.sessions]);

  const recentSessions = useMemo(() =>
    [...data.sessions]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 6),
    [data.sessions]
  );

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

  const totalAnalyzed = useMemo(
    () => Object.keys(data.libMap).length + Object.keys(data.sesMap).length,
    [data.libMap, data.sesMap]
  );

  const counts = useMemo(() => ({
    domains:          data.domains.length,
    agents:           data.agents.length,
    scenarios:        data.scenarios.length,
    chains:           data.chains.length,
    sessions:         data.sessions.length,
    startedSessions:  data.sessions.filter(s => s.status !== 'pending').length,
    completeSessions: completeSessions.length,
  }), [data, completeSessions]);

  const stepStates = useMemo(() =>
    STEPS.map(step => {
      const isDone   = step.check(counts);
      const reqsMet  = (step.requiresSteps || []).every(n => STEPS[n - 1].check(counts));
      const isLocked = !isDone && !reqsMet;
      const isActive = !isDone && reqsMet;
      return { isDone, isActive, isLocked };
    }),
    [counts]
  );

  const allStepsDone   = stepStates.every(s => s.isDone);
  const doneCount      = stepStates.filter(s => s.isDone).length;
  const currentStepNum = stepStates.findIndex(s => s.isActive) + 1;
  const isReady        = counts.domains > 0 && counts.agents > 0 && counts.scenarios > 0;

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  const Skeleton = ({ h = 'h-32' }) => (
    <div className={`${h} rounded-lg animate-pulse`}
      style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }} />
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <PageHeader
        icon={Shield}
        title="WARROOM"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleGuide}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
              style={{
                backgroundColor: guideOpen ? 'rgba(240,165,0,0.1)' : 'transparent',
                color: guideOpen ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                border: `1px solid ${guideOpen ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
              }}>
              <BookOpen className="w-3.5 h-3.5" />
              {guideOpen ? 'Hide Guide' : 'Setup Guide'}
              {!guideOpen && currentStepNum > 0 && (
                <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ml-0.5"
                  style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                  {currentStepNum}
                </span>
              )}
            </button>
            <Link to="/sessions/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all"
                style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                <Plus className="w-4 h-4" />
                New Session
              </button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-5">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {loading ? [1,2,3,4].map(i => <Skeleton key={i} h="h-20" />) : (<>
            <StatCard icon={Swords}     label="Sessions"        color="#2E86AB"
              value={data.sessions.length}
              sub={data.sessions.length === 0 ? 'None yet' : `${activeSessions.length} active · ${completeSessions.length} complete`}
              to="/sessions" />
            <StatCard icon={Bot}        label="Analyst Agents"  color="#7B2D8B"
              value={data.agents.length}
              sub={data.agents.length === 0 ? 'None configured' : `across ${data.domains.length} domain${data.domains.length !== 1 ? 's' : ''}`}
              to="/agents" />
            <StatCard icon={Target}     label="Scenarios"       color="#27AE60"
              value={data.scenarios.length}
              sub={data.scenarios.length === 0 ? 'None created' : `${data.scenarios.filter(s => s.status === 'active').length || data.scenarios.length} active`}
              to="/scenarios" />
            <StatCard icon={TrendingUp} label="Threat Findings" color="#D68910"
              value={findings.total}
              sub={findings.total === 0 ? 'From completed sessions' : `${findings.CRITICAL} critical · ${findings.HIGH} high`}
              to="/reports" />
          </>)}
        </div>

        {/* ── Main 2+1 grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* ── LEFT 2/3 ─────────────────────────────────────────────────── */}
          <div className="col-span-2 space-y-5">

            {/* Guided workflow */}
            {guideOpen && (loading ? <Skeleton h="h-80" /> : (
              <div className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>

                <div className="px-5 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--wr-border)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>
                      {allStepsDone ? 'Workflow Complete' : 'Getting Started'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                      {allStepsDone
                        ? 'All steps complete — your workspace is fully set up.'
                        : 'Follow these steps to run your first threat assessment'}
                    </p>
                  </div>
                  {allStepsDone
                    ? <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#27AE60' }} />
                        <span className="text-xs font-semibold" style={{ color: '#27AE60' }}>All done</span>
                      </div>
                    : <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                        {doneCount} / {STEPS.length}
                      </span>
                  }
                </div>

                {!allStepsDone && (
                  <div className="px-5 pt-3 pb-1">
                    <div className="h-1 rounded-full w-full" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
                      <div className="h-1 rounded-full transition-all"
                        style={{ backgroundColor: 'var(--wr-amber)', width: `${(doneCount / STEPS.length) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div>
                  {STEPS.map((step, i) => (
                    <WorkflowStep
                      key={step.key}
                      step={step}
                      counts={counts}
                      isDone={stepStates[i].isDone}
                      isActive={stepStates[i].isActive}
                      isLocked={stepStates[i].isLocked}
                    />
                  ))}
                </div>

                {isReady && !allStepsDone && (
                  <div className="px-5 py-4 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(39,174,96,0.05)', borderTop: '1px solid rgba(39,174,96,0.2)' }}>
                    <p className="text-sm" style={{ color: '#27AE60' }}>
                      Workspace ready — you can start a session now.
                    </p>
                    <Link to="/sessions/new">
                      <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold flex-shrink-0 ml-4"
                        style={{ backgroundColor: '#27AE60', color: '#fff' }}>
                        <Play className="w-3.5 h-3.5" /> Start Session
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {/* Sessions */}
            {loading ? <Skeleton h="h-64" /> : (
              <div className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="px-5 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--wr-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Sessions</p>
                  <Link to="/sessions"
                    className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--wr-amber)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {recentSessions.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Swords className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--wr-amber)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--wr-text-secondary)' }}>No sessions yet</p>
                    <p className="text-xs mb-4" style={{ color: 'var(--wr-text-muted)' }}>
                      {isReady
                        ? 'Your workspace is ready — start your first session.'
                        : 'Complete the setup guide above, then start a session.'}
                    </p>
                    {isReady && (
                      <Link to="/sessions/new">
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
                          style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                          <Plus className="w-3.5 h-3.5" /> New Session
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {activeSessions.length > 0 && (
                      <div style={{ borderBottom: '1px solid var(--wr-border)' }}>
                        <p className="px-5 py-2 text-xs font-bold tracking-widest font-mono"
                          style={{ backgroundColor: 'rgba(46,134,171,0.04)', color: '#2E86AB' }}>
                          IN PROGRESS
                        </p>
                        {activeSessions.slice(0, 3).map(s => <SessionRow key={s.id} session={s} />)}
                      </div>
                    )}
                    {recentSessions.filter(s => !['round1','round2'].includes(s.status)).length > 0 && (
                      <div>
                        {activeSessions.length > 0 && (
                          <p className="px-5 py-2 text-xs font-bold tracking-widest font-mono"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--wr-text-muted)' }}>
                            RECENT
                          </p>
                        )}
                        {recentSessions
                          .filter(s => !['round1','round2'].includes(s.status))
                          .slice(0, activeSessions.length > 0 ? 3 : 6)
                          .map(s => <SessionRow key={s.id} session={s} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Threat findings — only when completed sessions have data */}
            {!loading && completeSessions.length > 0 && findings.total > 0 && (
              <div className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="px-5 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--wr-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Threat Findings</p>
                  <Link to="/reports"
                    className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--wr-amber)' }}>
                    Full report <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-5 py-4 grid grid-cols-4 gap-3">
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                    <div key={sev} className="rounded p-3 text-center"
                      style={{ backgroundColor: `${SEV_COLOR[sev]}0d`, border: `1px solid ${SEV_COLOR[sev]}2a` }}>
                      <p className="text-xl font-bold font-mono" style={{ color: SEV_COLOR[sev] }}>{findings[sev]}</p>
                      <p className="text-xs font-bold font-mono mt-1" style={{ color: SEV_COLOR[sev], opacity: 0.8 }}>{sev}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT 1/3 ─────────────────────────────────────────────────── */}
          <div className="col-span-1 space-y-5">

            {/* Primary actions */}
            {loading ? <Skeleton h="h-44" /> : (
              <div className="space-y-3">
                <Link to="/sessions/new" className="block">
                  <div className="rounded-lg p-5 transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--wr-amber)', cursor: 'pointer' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0D1B2A' }}>Start New Session</p>
                        <p className="text-xs mt-0.5" style={{ color: '#0D1B2A', opacity: 0.65 }}>
                          Structured threat assessment with your analyst team
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                        <Swords className="w-5 h-5" style={{ color: '#0D1B2A' }} />
                      </div>
                    </div>
                  </div>
                </Link>
                <Link to="/sessions/new?mode=live" className="block">
                  <div className="rounded-lg p-5 transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid rgba(240,165,0,0.35)', cursor: 'pointer' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold" style={{ color: 'var(--wr-amber)' }}>Live Debate Room</p>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>
                            NEW
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                          Watch agents debate in real-time — interject, direct, ask questions
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)' }}>
                        <Zap className="w-5 h-5" style={{ color: 'var(--wr-amber)' }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Workspace shortcuts */}
            {loading ? <Skeleton h="h-48" /> : (
              <div className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <p className="px-4 py-3 text-xs font-bold tracking-widest font-mono border-b"
                  style={{ color: 'var(--wr-text-muted)', borderColor: 'var(--wr-border)' }}>
                  WORKSPACE
                </p>
                {[
                  { to: '/domains',   icon: Globe,   label: 'Threat Domains',  sub: `${counts.domains} configured`,  color: '#2E86AB' },
                  { to: '/agents',    icon: Bot,     label: 'Analyst Agents',  sub: `${counts.agents} added`,        color: '#7B2D8B' },
                  { to: '/scenarios', icon: Target,  label: 'Scenarios',       sub: `${counts.scenarios} available`, color: '#27AE60' },
                  { to: '/chains',    icon: Link2,   label: 'Threat Chains',   sub: `${counts.chains} in library`,   color: '#F0A500' },
                ].map(({ to, icon: Icon, label, sub, color }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110 group border-b last:border-0"
                    style={{ borderColor: 'var(--wr-border)' }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: 'var(--wr-text-muted)' }} />
                  </Link>
                ))}
              </div>
            )}

            {/* Analysis tools */}
            {loading ? <Skeleton h="h-40" /> : (
              <div className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <p className="px-4 py-3 text-xs font-bold tracking-widest font-mono border-b"
                  style={{ color: 'var(--wr-text-muted)', borderColor: 'var(--wr-border)' }}>
                  ANALYSIS TOOLS
                </p>
                {[
                  { to: '/reports',         icon: FileText,  label: 'Reports',         sub: 'Export session findings',         color: '#546E7A' },
                  { to: '/chain-breaker',   icon: Scissors,  label: 'Chain Breaker',   sub: `${totalAnalyzed} analyses saved`, color: '#C0392B' },
                  { to: '/threatmap',       icon: Map,       label: 'Threat Map',      sub: 'Visualise threat landscape',      color: '#2E86AB' },
                  { to: '/agent-analytics', icon: BarChart3, label: 'Agent Analytics', sub: 'Assess agent performance',        color: '#7B2D8B' },
                ].map(({ to, icon: Icon, label, sub, color }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110 group border-b last:border-0"
                    style={{ borderColor: 'var(--wr-border)' }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: 'var(--wr-text-muted)' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
