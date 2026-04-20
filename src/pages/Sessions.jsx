import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Swords, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WrButton from '@/components/ui/WrButton';

const STATUS_CONFIG = {
  pending: { color: '#546E7A', label: 'PENDING' },
  round1:  { color: '#2E86AB', label: 'ROUND 1' },
  round2:  { color: '#D68910', label: 'ROUND 2' },
  complete:{ color: '#27AE60', label: 'COMPLETE' },
};

export default function Sessions() {
  const { db } = useWorkspace();
  const [sessions, setSessions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    Promise.all([
      db.Session.list('-created_date'),
      db.Domain.list(),
      db.Scenario.list(),
    ]).then(([s,d,sc]) => {
      setSessions(s); setDomains(d); setScenarios(sc); setLoading(false);
    });
  }, [db]);

  const domainById = id => domains.find(d => d.id === id);
  const scenarioById = id => scenarios.find(s => s.id === id);

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
        subtitle="Structured two-round analysis events"
        actions={
          <Link to="/sessions/new">
            <WrButton><Plus className="w-4 h-4" /> New Session</WrButton>
          </Link>
        }
      />

      {loading ? (
        <div className="p-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No sessions yet"
          description="A session runs your selected agents through a structured two-round analysis of any scenario. Start by selecting a scenario and a team of agents."
          action={null}
          actionLabel={null}
        />
      ) : (
        <div className="p-6 space-y-3">
          {sessions.map(session => {
            const dom = domainById(session.domain_id);
            const sc = scenarioById(session.scenario_id);
            const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            return (
              <Link key={session.id} to={`/sessions/${session.id}`} className="block rounded p-4 flex items-center gap-4 transition-all duration-200 hover:border-amber-500/50 hover:shadow-[0_0_16px_rgba(240,165,0,0.18)]"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{session.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded font-bold font-mono" style={{ backgroundColor: `${status.color}22`, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                    {sc && <span>{sc.name}</span>}
                    {dom && <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${dom.color}22`, color: dom.color }}>{dom.name}</span>}
                    {session.phase_focus && <span>📍 {session.phase_focus}</span>}
                    <span>{session.agent_ids?.length || 0} agents</span>
                    <span>{new Date(session.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, session)}
                  className="flex-shrink-0 p-2 rounded transition-colors hover:bg-red-900/20"
                  style={{ color: '#C0392B' }}
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}