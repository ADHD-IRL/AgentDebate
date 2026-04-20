import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '@/lib/WorkspaceContext';
import PageHeader from '@/components/ui/PageHeader';
import { Map, AlertTriangle } from 'lucide-react';
import ThreatHeatmap from '@/components/threatmap/ThreatHeatmap';
import DisciplineRadar from '@/components/threatmap/DisciplineRadar';
import SeverityByDiscipline from '@/components/threatmap/SeverityByDiscipline';
import CoverageGapPanel from '@/components/threatmap/CoverageGapPanel';

const SEV_COLORS = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ThreatMap() {
  const { db } = useWorkspace();
  const [threats, setThreats] = useState([]);
  const [agents, setAgents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('heatmap');
  const [filterSession, setFilterSession] = useState('');

  useEffect(() => {
    if (!db) return;
    Promise.all([
      db.Threat.list(),
      db.Agent.list(),
      db.Domain.list(),
      db.Session.list(),
      db.SessionAgent.list(),
    ]).then(([t, a, d, s, sa]) => {
      setThreats(t);
      setAgents(a);
      setDomains(d);
      setSessions(s);
      setSessionAgents(sa);
      setLoading(false);
    });
  }, [db]);

  const views = [
    { id: 'heatmap', label: 'HEATMAP' },
    { id: 'radar', label: 'DISCIPLINE RADAR' },
    { id: 'severity', label: 'SEVERITY BREAKDOWN' },
  ];

  // Filter threats by selected session
  const filteredThreats = useMemo(() => {
    if (!filterSession) return threats;
    return threats.filter(t => t.scenario_id &&
      sessions.find(s => s.id === filterSession && s.scenario_id === t.scenario_id));
  }, [threats, filterSession, sessions]);

  // Filter agents by selected session
  const filteredAgents = useMemo(() => {
    if (!filterSession) return agents;
    const sessionAgentIds = new Set(
      sessionAgents.filter(sa => sa.session_id === filterSession).map(sa => sa.agent_id)
    );
    return agents.filter(a => sessionAgentIds.has(a.id));
  }, [agents, sessionAgents, filterSession]);

  // Summary stats
  const stats = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    filteredThreats.forEach(t => {
      const sev = t.severity || 'MEDIUM';
      counts[sev] = (counts[sev] || 0) + 1;
    });
    const disciplines = new Set(filteredAgents.map(a => a.discipline).filter(Boolean)).size;
    return { total: filteredThreats.length, disciplines, ...counts };
  }, [filteredThreats, filteredAgents]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <PageHeader
        icon={Map}
        title="THREAT MAP"
        subtitle="Coverage gaps · Threat concentration · Discipline alignment"
      />

      {/* Toolbar */}
      <div
        className="flex items-center gap-4 px-6 py-2 border-b flex-wrap"
        style={{ backgroundColor: 'var(--wr-bg-secondary)', borderColor: 'var(--wr-border)' }}
      >
        {/* View tabs */}
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className="px-4 py-1.5 text-xs font-mono font-bold tracking-wider transition-colors"
              style={{
                backgroundColor: activeView === v.id ? 'var(--wr-amber)' : 'transparent',
                color: activeView === v.id ? '#0D1B2A' : 'var(--wr-text-secondary)',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Session filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--wr-text-muted)' }}>SESSION</span>
          <select
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
            className="px-3 py-1.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}
          >
            <option value="">All Threats</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.status?.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs font-mono tracking-widest" style={{ color: 'var(--wr-text-muted)' }}>LOADING DATA...</p>
          </div>
        </div>
      ) : filteredThreats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12" style={{ color: 'var(--wr-text-muted)' }} />
          <p className="text-sm font-mono" style={{ color: 'var(--wr-text-muted)' }}>
            {filterSession
              ? 'No threats linked to this session.'
              : 'No threats identified yet. Add threats via the Threats page.'}
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Summary stats bar */}
          <div
            className="rounded px-5 py-3 flex items-center gap-6 flex-wrap"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}
          >
            <div className="flex-shrink-0">
              <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>TOTAL THREATS</p>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{stats.total}</p>
            </div>
            <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />
            {SEVERITIES.map(s => (
              <div key={s} className="flex-shrink-0 text-center">
                <p className="text-xs font-mono" style={{ color: SEV_COLORS[s] }}>{s}</p>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{stats[s]}</p>
              </div>
            ))}
            <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />
            <div className="flex-shrink-0 text-center">
              <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>DISCIPLINES</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{stats.disciplines}</p>
            </div>
            {filterSession && (
              <>
                <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />
                <div
                  className="text-xs font-mono px-2.5 py-1 rounded"
                  style={{ backgroundColor: hexToRgba('#F0A500', 0.12), color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.3)' }}
                >
                  FILTERED: {sessions.find(s => s.id === filterSession)?.name}
                </div>
              </>
            )}
          </div>

          {/* Active view */}
          {activeView === 'heatmap' && (
            <ThreatHeatmap threats={filteredThreats} agents={filteredAgents} domains={domains} />
          )}
          {activeView === 'radar' && (
            <DisciplineRadar threats={filteredThreats} agents={filteredAgents} domains={domains} />
          )}
          {activeView === 'severity' && (
            <SeverityByDiscipline threats={filteredThreats} agents={filteredAgents} domains={domains} />
          )}

          {/* Coverage gap always visible */}
          <CoverageGapPanel threats={filteredThreats} agents={filteredAgents} />
        </div>
      )}
    </div>
  );
}
