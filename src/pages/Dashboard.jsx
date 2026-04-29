import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useAuth } from '@/lib/AuthContext';
import { parseAnalysisConfigs } from '@/lib/chainBreakStorage';
import { AlertTriangle, ChevronDown, LogOut } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

import KpiStrip      from '@/components/dashboard/KpiStrip';
import PriorityQueue from '@/components/dashboard/PriorityQueue';
import FindingsMatrix from '@/components/dashboard/FindingsMatrix';
import SessionFeed   from '@/components/dashboard/SessionFeed';
import CoveragePanel from '@/components/dashboard/CoveragePanel';
import QuickActions  from '@/components/dashboard/QuickActions';
import { SEV_ORDINAL } from '@/components/dashboard/atoms';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SEV_KEYS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function withinDays(isoDate, days) {
  if (!isoDate) return false;
  return Date.now() - new Date(isoDate).getTime() < days * 86400000;
}

function spark14(items, getDate, getValue) {
  const now    = Date.now();
  const bucket = 86400000;
  const bins   = Array(14).fill(0);
  for (const item of items) {
    const d = new Date(getDate(item)).getTime();
    const daysAgo = Math.floor((now - d) / bucket);
    if (daysAgo >= 0 && daysAgo < 14) bins[13 - daysAgo] += getValue(item);
  }
  return bins;
}

// ── Range options ──────────────────────────────────────────────────────────────

const RANGES = [
  { key: '14D', label: 'Last 14 days', days: 14 },
  { key: '30D', label: 'Last 30 days', days: 30 },
  { key: '90D', label: 'Last 90 days', days: 90 },
];

// ── Main export ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { db }        = useWorkspace();
  const { signOut }   = useAuth();
  const navigate      = useNavigate();
  const [params, setParams] = useSearchParams();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const range     = params.get('range')  || '14D';
  const kpiFilter = params.get('kpi')    || null;

  const setRange     = (v) => { const p = new URLSearchParams(params); p.set('range', v);  setParams(p); };
  const setKpiFilter = (v) => {
    const p = new URLSearchParams(params);
    if (v) p.set('kpi', v); else p.delete('kpi');
    setParams(p);
  };

  const rangeDays = RANGES.find(r => r.key === range)?.days ?? 14;

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

  // ── Derived maps ──────────────────────────────────────────────────────────────

  const agentMap   = useMemo(() => Object.fromEntries(data.agents.map(a => [a.id, a])),   [data.agents]);
  const domainMap  = useMemo(() => Object.fromEntries(data.domains.map(d => [d.id, d])),  [data.domains]);
  const scenarioMap = useMemo(() => Object.fromEntries(data.scenarios.map(s => [s.id, s])), [data.scenarios]);

  const inRange = useCallback(
    (isoDate) => withinDays(isoDate, rangeDays),
    [rangeDays]
  );

  // ── Session enrichment ────────────────────────────────────────────────────────

  const enrichedSessions = useMemo(() => {
    const saBySession = {};
    for (const sa of data.sessionAgents) {
      if (!saBySession[sa.session_id]) saBySession[sa.session_id] = [];
      saBySession[sa.session_id].push(sa);
    }

    return data.sessions.map(s => {
      const sas        = saBySession[s.id] || [];
      const completed  = sas.filter(sa => sa.status === 'complete');
      const conf       = sas.length > 0 ? completed.length / sas.length : null;

      const drifts = completed
        .filter(sa => sa.round1_severity && sa.round2_revised_severity)
        .map(sa => (SEV_ORDINAL[sa.round2_revised_severity] ?? 0) - (SEV_ORDINAL[sa.round1_severity] ?? 0));
      const drift = drifts.length ? median(drifts) : null;

      // Only count agents that have actually produced assessments
      const ranSAs = sas.filter(sa => sa.round1_assessment);

      const sevCounts  = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const sa of ranSAs) {
        const sev = sa.round2_revised_severity || sa.round1_severity;
        if (sev && sevCounts[sev] !== undefined) sevCounts[sev]++;
      }
      const topSeverity = SEV_KEYS.find(k => sevCounts[k] > 0) || null;
      const findingCount = ranSAs.length;

      const r1Complete   = sas.length > 0 && sas.every(sa => sa.round1_assessment);
      const r2Complete   = sas.length > 0 && sas.every(sa => sa.round2_rebuttal);
      const synth        = data.syntheses.find(sy => sy.session_id === s.id);

      return {
        ...s,
        agentCount:          sas.length,
        findingCount,
        criticalCount:       sevCounts.CRITICAL,
        topSeverity,
        confidence:          conf,
        drift,
        scenario:            scenarioMap[s.scenario_id]?.name || null,
        r1_complete:         r1Complete,
        r2_complete:         r2Complete,
        synthesis_complete:  !!synth?.summary,
      };
    });
  }, [data.sessions, data.sessionAgents, data.syntheses, scenarioMap]);

  // ── KPI strip data ────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const rangeEnd   = Date.now();
    const rangeStart = rangeEnd - rangeDays * 86400000;
    const prevStart  = rangeStart - rangeDays * 86400000;

    const inRangeSessions = enrichedSessions.filter(s => inRange(s.created_at));
    const prevSessions    = enrichedSessions.filter(s => {
      const t = new Date(s.created_at || 0).getTime();
      return t >= prevStart && t < rangeStart;
    });

    const rangedSAs = data.sessionAgents.filter(sa => {
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      return s && inRange(s.created_at);
    });

    const criticals  = rangedSAs.filter(sa => sa.round1_assessment && (sa.round2_revised_severity || sa.round1_severity) === 'CRITICAL');
    const prevCrit   = data.sessionAgents.filter(sa => {
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      if (!s) return false;
      const t = new Date(s.created_at || 0).getTime();
      return t >= prevStart && t < rangeStart && sa.round1_assessment && (sa.round2_revised_severity || sa.round1_severity) === 'CRITICAL';
    });

    const openCount  = data.sessionAgents.filter(sa => {
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      return s && ['round1', 'round2'].includes(s.status) && sa.round1_assessment;
    }).length;

    const completedConfs = enrichedSessions.filter(s => inRange(s.created_at) && s.confidence != null).map(s => s.confidence);
    const avgConf = completedConfs.length ? completedConfs.reduce((a, b) => a + b, 0) / completedConfs.length : null;

    const driftVals = inRangeSessions.filter(s => s.drift != null).map(s => s.drift);
    const medDrift  = driftVals.length ? median(driftVals) : null;

    const critSpark  = spark14(data.sessionAgents, sa => {
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      return s?.created_at || new Date(0).toISOString();
    }, sa => (sa.round2_revised_severity || sa.round1_severity) === 'CRITICAL' ? 1 : 0);

    const sessSpark  = spark14(enrichedSessions, s => s.created_at || new Date(0).toISOString(), () => 1);

    return {
      critical: { value: criticals.length, delta: criticals.length - prevCrit.length, spark: critSpark },
      open:     { value: openCount,         delta: null },
      sessions: { value: inRangeSessions.length, delta: inRangeSessions.length - prevSessions.length, spark: sessSpark },
      conf:     { value: avgConf,           delta: null },
      drift:    { value: medDrift,          delta: null },
    };
  }, [enrichedSessions, data.sessionAgents, rangeDays, inRange]);

  // ── Priority queue ────────────────────────────────────────────────────────────

  const priorityItems = useMemo(() => {
    const items = [];

    // Unresolved criticals — active sessions with CRITICAL findings
    for (const s of enrichedSessions) {
      if (!['round1', 'round2'].includes(s.status)) continue;
      if ((s.criticalCount || 0) === 0) continue;
      const scenario = scenarioMap[s.scenario_id];
      items.push({
        kind:     'unresolved',
        severity: 'CRITICAL',
        title:    s.name || `Session ${s.id?.slice(0, 6)}`,
        subtitle: scenario?.name || 'No scenario',
        meta:     `${s.criticalCount} critical`,
        href:     `/sessions/${s.id}`,
        action:   'Review',
        agents:   [],
      });
    }

    // Severity drift — sessions where |drift| >= 2
    for (const s of enrichedSessions) {
      if (s.drift == null || Math.abs(s.drift) < 2) continue;
      const scenario = scenarioMap[s.scenario_id];
      items.push({
        kind:     'drift',
        severity: s.drift > 0 ? 'HIGH' : 'MEDIUM',
        title:    s.name || `Session ${s.id?.slice(0, 6)}`,
        subtitle: scenario?.name || 'No scenario',
        meta:     `${s.drift > 0 ? '+' : ''}${s.drift?.toFixed(1)} avg drift`,
        href:     `/sessions/${s.id}`,
        action:   'Analyse',
        agents:   [],
      });
    }

    // Coverage gaps — domains with no agents
    for (const d of data.domains) {
      const agentCount = data.agents.filter(a => a.domain_id === d.id).length;
      if (agentCount > 0) continue;
      items.push({
        kind:     'gap',
        severity: 'HIGH',
        title:    `${d.name || 'Unnamed domain'} has no agents`,
        subtitle: 'Assign at least one agent to this domain',
        meta:     '0 agents',
        href:     '/agents',
        action:   'Assign',
        agents:   [],
      });
    }

    // Stale scenarios — not used in >30d
    for (const sc of data.scenarios) {
      if (!withinDays(sc.created_at, 365)) continue; // only flag if scenario exists
      const lastSession = enrichedSessions
        .filter(s => s.scenario_id === sc.id)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
      if (lastSession && withinDays(lastSession.created_at, 30)) continue;
      if (!lastSession && withinDays(sc.created_at, 30)) continue;
      items.push({
        kind:     'stale',
        severity: 'LOW',
        title:    `${sc.name || 'Unnamed scenario'} not assessed recently`,
        subtitle: lastSession ? `Last session ${Math.floor((Date.now() - new Date(lastSession.created_at).getTime()) / 86400000)}d ago` : 'Never run',
        meta:     '>30d stale',
        href:     '/scenarios',
        action:   'Run',
        agents:   [],
      });
    }

    // Low confidence — complete sessions with conf < 0.65
    for (const s of enrichedSessions) {
      if (s.status !== 'complete') continue;
      if (s.confidence == null || s.confidence >= 0.65) continue;
      const scenario = scenarioMap[s.scenario_id];
      items.push({
        kind:     'lowconf',
        severity: 'MEDIUM',
        title:    s.name || `Session ${s.id?.slice(0, 6)}`,
        subtitle: scenario?.name || 'No scenario',
        meta:     `${Math.round(s.confidence * 100)}% confidence`,
        href:     `/sessions/${s.id}`,
        action:   'Review',
        agents:   [],
      });
    }

    // Sort: CRITICAL > HIGH > MEDIUM > LOW
    const ord = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
    return items.sort((a, b) => (ord[b.severity] || 0) - (ord[a.severity] || 0));
  }, [enrichedSessions, data.domains, data.agents, data.scenarios, scenarioMap]);

  // ── Findings matrix ───────────────────────────────────────────────────────────

  const { matrixRows, matrixDomainMap, totalFindings } = useMemo(() => {
    const cutoff = Date.now() - 14 * 86400000;

    const recentSAs = data.sessionAgents.filter(sa => {
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      // Only include agents that have actually produced an assessment
      return s && sa.round1_assessment && new Date(s.created_at || 0).getTime() >= cutoff;
    });

    const byDomain = {};
    for (const sa of recentSAs) {
      const agent = agentMap[sa.agent_id];
      if (!agent) continue;
      const domId = agent.domain_id || '__none__';
      if (!byDomain[domId]) byDomain[domId] = { domain_id: domId, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, spark: Array(14).fill(0) };
      const sev = sa.round2_revised_severity || sa.round1_severity;
      if (sev && byDomain[domId][sev] !== undefined) byDomain[domId][sev]++;
      const s = enrichedSessions.find(x => x.id === sa.session_id);
      if (s) {
        const daysAgo = Math.floor((Date.now() - new Date(s.created_at || 0).getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 14) byDomain[domId].spark[13 - daysAgo]++;
      }
    }

    const rows = Object.values(byDomain).sort((a, b) => {
      const aSum = SEV_KEYS.reduce((s, k) => s + a[k], 0);
      const bSum = SEV_KEYS.reduce((s, k) => s + b[k], 0);
      return bSum - aSum;
    });

    const dMap = {};
    for (const d of data.domains) {
      const agentCount = data.agents.filter(a => a.domain_id === d.id).length;
      dMap[d.id] = { name: d.name, color: d.color, agentCount };
    }

    const total = rows.reduce((s, r) => s + SEV_KEYS.reduce((ss, k) => ss + r[k], 0), 0);
    return { matrixRows: rows, matrixDomainMap: dMap, totalFindings: total };
  }, [data.sessionAgents, data.domains, data.agents, enrichedSessions, agentMap]);

  // ── Coverage panel data ───────────────────────────────────────────────────────

  const coverageDomains = useMemo(() => {
    return data.domains.map(d => {
      const agentCount    = data.agents.filter(a => a.domain_id === d.id).length;
      const domSessions   = enrichedSessions.filter(s => {
        const sas = data.sessionAgents.filter(sa => sa.session_id === s.id);
        return sas.some(sa => agentMap[sa.agent_id]?.domain_id === d.id);
      });
      const openFindings  = data.sessionAgents.filter(sa => {
        const s = enrichedSessions.find(x => x.id === sa.session_id);
        const agent = agentMap[sa.agent_id];
        return agent?.domain_id === d.id && s && ['round1', 'round2'].includes(s.status);
      }).length;
      return { id: d.id, name: d.name, color: d.color, agentCount, sessions: domSessions.length, openFindings };
    }).sort((a, b) => b.sessions - a.sessions);
  }, [data.domains, data.agents, data.sessionAgents, enrichedSessions, agentMap]);

  // ── Workspace readiness ───────────────────────────────────────────────────────

  const isWorkspaceReady = data.domains.length > 0 && data.agents.length > 0 && data.scenarios.length > 0;

  // ── Range selector ────────────────────────────────────────────────────────────

  const [rangeOpen, setRangeOpen] = useState(false);

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  const Skeleton = ({ h = 120 }) => (
    <div style={{ height: h, borderRadius: 8, backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <PageHeader
        title="Dashboard"
        subtitle="Analyst Operations Centre"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Range selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setRangeOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 6,
                  backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)',
                  color: 'var(--wr-text-primary)', fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {RANGES.find(r => r.key === range)?.label}
                <ChevronDown style={{ width: 12, height: 12 }} />
              </button>
              {rangeOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 50,
                  backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)',
                  borderRadius: 6, overflow: 'hidden', minWidth: 140,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                  {RANGES.map(r => (
                    <button key={r.key} onClick={() => { setRange(r.key); setRangeOpen(false); }} style={{
                      display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left',
                      fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                      backgroundColor: r.key === range ? 'rgba(240,165,0,0.1)' : 'transparent',
                      color: r.key === range ? 'var(--wr-amber)' : 'var(--wr-text-primary)',
                      border: 'none', cursor: 'pointer',
                    }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 6,
                backgroundColor: 'transparent', border: '1px solid var(--wr-border)',
                color: 'var(--wr-text-muted)', fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C0392B'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--wr-text-muted)'; e.currentTarget.style.borderColor = 'var(--wr-border)'; }}
            >
              <LogOut style={{ width: 12, height: 12 }} />
              Sign out
            </button>
          </div>
        }
      />

      <div style={{ padding: '0 24px 32px', maxWidth: 1440, margin: '0 auto' }}>

        {/* Setup banner — only when workspace incomplete */}
        {!loading && !isWorkspaceReady && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 7, marginBottom: 16,
            backgroundColor: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)',
          }}>
            <AlertTriangle style={{ width: 14, height: 14, color: 'var(--wr-amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--wr-text-primary)', flex: 1 }}>
              Your workspace needs setup before running assessments — add domains, agents, and scenarios.
            </span>
            <Link to="/guide" style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-amber)', textDecoration: 'none' }}>
              Setup Guide →
            </Link>
          </div>
        )}

        {/* KPI Strip */}
        <div style={{ marginBottom: 16 }}>
          {loading ? <Skeleton h={88} /> : (
            <KpiStrip kpis={kpis} activeFilter={kpiFilter} onFilter={setKpiFilter} />
          )}
        </div>

        {/* Main 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Priority Queue */}
            {loading ? <Skeleton h={220} /> : (
              <PriorityQueue items={priorityItems} kpiFilter={kpiFilter} />
            )}

            {/* Findings Matrix */}
            {loading ? <Skeleton h={180} /> : (
              <FindingsMatrix
                matrix={matrixRows}
                domainMap={matrixDomainMap}
                totalFindings={totalFindings}
              />
            )}

            {/* Session Feed */}
            {loading ? <Skeleton h={240} /> : (
              <SessionFeed sessions={enrichedSessions} kpiFilter={kpiFilter} />
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <QuickActions />
            <CoveragePanel domains={coverageDomains} analysts={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
