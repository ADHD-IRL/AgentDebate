import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, LogOut, LayoutDashboard } from 'lucide-react';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useAuth } from '@/lib/AuthContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import KpiRail    from '@/components/dashboard/KpiRail';
import Pipeline   from '@/components/dashboard/Pipeline';
import EventsList from '@/components/dashboard/EventsList';

// ── Helpers ────────────────────────────────────────────────────────────────

const SEV_ORDINAL = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
const SEV_KEYS    = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function startOfISOWeek(d) {
  const date = new Date(d);
  const day  = date.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// ── Main export ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { db, workspace } = useWorkspace();
  const { signOut }        = useAuth();
  const navigate           = useNavigate();
  const [params, setParams] = useSearchParams();

  const filter    = params.get('filter') || 'ALL';
  const [search, setSearch] = useState('');

  const setFilter = useCallback((v) => {
    const p = new URLSearchParams(params);
    if (v === 'ALL') p.delete('filter');
    else p.set('filter', v.toLowerCase().replace(' ', '-'));
    setParams(p);
  }, [params, setParams]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  // ── Data loading ───────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState({
    sessions: [], sessionAgents: [], syntheses: [], scenarios: [], agents: [],
  });

  const loadData = useCallback(() => {
    if (!db) return;
    Promise.all([
      db.Session.list(),
      db.SessionAgent.list(),
      db.SessionSynthesis.list(),
      db.Scenario.list(),
      db.Agent.list(),
    ]).then(([sessions, sessionAgents, syntheses, scenarios, agents]) => {
      setData({ sessions, sessionAgents, syntheses, scenarios, agents });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [db]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  // ── Derived maps ───────────────────────────────────────────────────────────

  const scenarioMap = useMemo(() =>
    Object.fromEntries(data.scenarios.map(s => [s.id, s])),
  [data.scenarios]);

  const agentMap = useMemo(() =>
    Object.fromEntries(data.agents.map(a => [a.id, a])),
  [data.agents]);

  // ── Session enrichment → event shape ─────────────────────────────────────

  const events = useMemo(() => {
    const saBySession = {};
    for (const sa of data.sessionAgents) {
      if (!saBySession[sa.session_id]) saBySession[sa.session_id] = [];
      saBySession[sa.session_id].push(sa);
    }

    return data.sessions.map(s => {
      const sas       = saBySession[s.id] || [];
      const ranSAs    = sas.filter(sa => sa.round1_assessment);
      const sevCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const sa of ranSAs) {
        const sev = sa.round2_revised_severity || sa.round1_severity;
        if (sev && sevCounts[sev] !== undefined) sevCounts[sev]++;
      }
      const topSeverity = SEV_KEYS.find(k => sevCounts[k] > 0) || 'LOW';
      const findingCount = ranSAs.length;
      const criticalCount = sevCounts.CRITICAL;

      const leadSA    = sas[0];
      const leadAgent = leadSA ? agentMap[leadSA.agent_id] : null;

      const isLive = (s.status === 'round1' || s.status === 'round2');

      return {
        id:       s.id,
        date:     s.created_at,
        title:    s.name || `Session ${s.id?.slice(0, 6)}`,
        scenario: scenarioMap[s.scenario_id]?.name || null,
        status:   s.status || 'pending',
        severity: topSeverity,
        findings: findingCount,
        critical: criticalCount,
        owner:    leadAgent?.name || null,
        live:     isLive,
      };
    });
  }, [data.sessions, data.sessionAgents, scenarioMap, agentMap]);

  // ── KPI calculations ───────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const now          = Date.now();
    const weekStart    = startOfISOWeek(now).getTime();
    const prevWeekStart = weekStart - 7 * 86400000;
    const day7ago      = now - 7 * 86400000;

    const inFlightSAs  = data.sessionAgents.filter(sa => {
      const s = data.sessions.find(x => x.id === sa.session_id);
      return s && (s.status === 'round1' || s.status === 'round2') && sa.round1_assessment;
    });
    const criticalCount = inFlightSAs.filter(sa =>
      (sa.round2_revised_severity || sa.round1_severity) === 'CRITICAL'
    ).length;

    const prevInFlightSAs = data.sessionAgents.filter(sa => {
      const s = data.sessions.find(x => x.id === sa.session_id);
      if (!s) return false;
      const t = new Date(s.created_at || 0).getTime();
      return t >= prevWeekStart && t < weekStart && sa.round1_assessment &&
        (s.status === 'round1' || s.status === 'round2');
    });
    const prevCritical = prevInFlightSAs.filter(sa =>
      (sa.round2_revised_severity || sa.round1_severity) === 'CRITICAL'
    ).length;

    const recentSyntheses = data.syntheses.filter(sy =>
      new Date(sy.created_at || 0).getTime() >= day7ago && sy.confidence != null
    );
    const avgConf = recentSyntheses.length
      ? recentSyntheses.reduce((a, sy) => a + sy.confidence, 0) / recentSyntheses.length
      : null;

    const thisWeekSessions  = data.sessions.filter(s => new Date(s.created_at || 0).getTime() >= weekStart);
    const prevWeekSessions  = data.sessions.filter(s => {
      const t = new Date(s.created_at || 0).getTime();
      return t >= prevWeekStart && t < weekStart;
    });

    const critDelta = criticalCount - prevCritical;
    const weekDelta = thisWeekSessions.length - prevWeekSessions.length;

    return {
      critical: {
        value:    criticalCount,
        delta:    critDelta,
        subLabel: `${critDelta >= 0 ? '+' : ''}${critDelta} / 7d`,
      },
      conf: {
        value:    avgConf,
        subLabel: avgConf != null ? `${Math.round(avgConf * 100)}% avg` : '—',
      },
      week: {
        value:    thisWeekSessions.length,
        delta:    weekDelta,
        subLabel: `${weekDelta >= 0 ? '+' : ''}${weekDelta} / wk`,
      },
    };
  }, [data.sessions, data.sessionAgents, data.syntheses]);

  // ── Pipeline counts ────────────────────────────────────────────────────────

  const pipelineCounts = useMemo(() => {
    const counts = { pending: 0, round1: 0, round2: 0, review: 0, complete: 0 };
    for (const s of data.sessions) {
      const k = s.status || 'pending';
      if (k in counts) counts[k]++;
    }
    return counts;
  }, [data.sessions]);

  // ── Filter & search ────────────────────────────────────────────────────────

  const activeFilterKey = filter === 'in-progress' ? 'IN PROGRESS'
    : filter === 'complete' ? 'COMPLETE'
    : 'ALL';

  const filteredEvents = useMemo(() => {
    let list = events;
    if (activeFilterKey === 'IN PROGRESS') {
      list = list.filter(e => e.status !== 'complete');
    } else if (activeFilterKey === 'COMPLETE') {
      list = list.filter(e => e.status === 'complete');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.scenario || '').toLowerCase().includes(q) ||
        (e.owner || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, activeFilterKey, search]);

  const filterLabel =
    activeFilterKey === 'COMPLETE'    ? 'completed'  :
    activeFilterKey === 'IN PROGRESS' ? 'in progress' : 'total';

  // ── Workspace readiness banner ─────────────────────────────────────────────

  const needsSetup = !loading && (
    data.sessions.length === 0 && data.agents.length === 0 && data.scenarios.length === 0
  );

  // ── Skeleton ───────────────────────────────────────────────────────────────

  const Skeleton = ({ h = 120 }) => (
    <div style={{ height: h, borderRadius: 6, backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  // ── Current date display ───────────────────────────────────────────────────

  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }, []);

  const timeStr = useMemo(() => {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm} UTC`;
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const FILTERS = ['ALL', 'IN PROGRESS', 'COMPLETE'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>

      {/* TopBar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--wr-border)',
        backgroundColor: 'var(--wr-bg-primary)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {/* Left: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
          }}>
            <LayoutDashboard style={{ width: 16, height: 16, color: 'var(--wr-amber)' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-primary)' }}>
              Dashboard
            </div>
            <div style={{ fontSize: 11, marginTop: 2, color: 'var(--wr-text-muted)' }}>
              {dateStr} · {timeStr}
              {workspace?.name && (
                <> · workspace <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-secondary)' }}>{workspace.name}</span></>
              )}
            </div>
          </div>
        </div>

        {/* Right: filter + search + CTA + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Filter pills */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--wr-border)', borderRadius: 6, overflow: 'hidden' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
                  padding: '6px 10px', border: 'none', cursor: 'pointer',
                  color: activeFilterKey === f ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                  backgroundColor: activeFilterKey === f ? 'rgba(240,165,0,0.1)' : 'transparent',
                  transition: 'all 0.12s',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--wr-border)', color: 'var(--wr-text-secondary)' }}>
            <Search style={{ width: 11, height: 11, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, scenarios, owners…"
              style={{
                width: 220, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, color: 'var(--wr-text-primary)', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* New event CTA */}
          <Link to="/sessions/new" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--wr-amber)', color: '#0D1B2A',
              fontSize: 14, fontWeight: 600,
            }}>
              <Plus style={{ width: 14, height: 14 }} />
              New event
            </button>
          </Link>

          {/* Sign out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 6,
                  backgroundColor: 'transparent', border: '1px solid var(--wr-border)',
                  color: 'var(--wr-text-muted)', fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C0392B'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--wr-text-muted)'; e.currentTarget.style.borderColor = 'var(--wr-border)'; }}
              >
                <LogOut style={{ width: 12, height: 12 }} />
                Sign out
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Sign out of your workspace</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Page body */}
      <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Setup banner */}
        {needsSetup && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 6,
            backgroundColor: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)',
          }}>
            <span style={{ fontSize: 12.5, color: 'var(--wr-text-primary)', flex: 1 }}>
              Your workspace needs setup before running assessments — add domains, agents, and scenarios.
            </span>
            <Link to="/guide" style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-amber)', textDecoration: 'none' }}>
              Setup Guide →
            </Link>
          </div>
        )}

        {/* KPI rail + Pipeline row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 20 }}>
          {loading ? <Skeleton h={130} /> : <KpiRail kpis={kpis} />}
          {loading ? <Skeleton h={130} /> : <Pipeline counts={pipelineCounts} total={data.sessions.length} />}
        </div>

        {/* Events list */}
        {loading ? <Skeleton h={400} /> : (
          <EventsList events={filteredEvents} filterLabel={filterLabel} />
        )}
      </div>
    </div>
  );
}
