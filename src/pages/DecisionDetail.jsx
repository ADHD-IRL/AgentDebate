import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { ArrowLeft, Plus, X, Play, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import WrButton from '@/components/ui/WrButton';
import { aggregateSessionRisk, riskBandFromScore } from '@/lib/risk';

const CRIT_COLOR = { LOW: '#27AE60', MEDIUM: '#D68910', HIGH: '#C0392B' };
const ASSUMPTION_STATUS = { holds: '#27AE60', monitoring: '#D68910', invalidated: '#C0392B' };
const SEV_COLORS = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };

export default function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db } = useWorkspace();
  const [decision, setDecision] = useState(null);
  const [options, setOptions] = useState([]);
  const [assumptions, setAssumptions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAssumption, setNewAssumption] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [rationale, setRationale] = useState('');
  const [decidedBy, setDecidedBy] = useState('');

  const load = async () => {
    if (!db) return;
    const [d, opts, asm, allSessions, allSA] = await Promise.all([
      db.Decision.get(id),
      db.DecisionOption.filter({ decision_id: id }),
      db.DecisionAssumption.filter({ decision_id: id }),
      db.Session.list(),
      db.SessionAgent.list(),
    ]);
    setDecision(d);
    setOptions((opts || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setAssumptions(asm || []);
    setSessions((allSessions || []).filter(s => s.decision_id === id));
    setSessionAgents(allSA || []);
    setRationale(d?.decision_rationale || '');
    setLoading(false);
  };
  useEffect(() => { load(); }, [db, id]);

  // Per-option risk aggregate from its linked sessions
  const optionRisk = useMemo(() => {
    const map = {};
    for (const opt of options) {
      const optSessions = sessions.filter(s => s.decision_option_id === opt.id);
      const sids = new Set(optSessions.map(s => s.id));
      const sas = sessionAgents.filter(sa => sids.has(sa.session_id));
      map[opt.id] = { agg: aggregateSessionRisk(sas), sessionCount: optSessions.length };
    }
    return map;
  }, [options, sessions, sessionAgents]);

  // Recommended option = lowest peak risk among options that have been analyzed
  const recommended = useMemo(() => {
    const scored = options.map(o => ({ o, agg: optionRisk[o.id]?.agg })).filter(x => x.agg);
    if (!scored.length) return null;
    return scored.sort((a, b) => a.agg.peak - b.agg.peak || a.agg.avgExposure - b.agg.avgExposure)[0].o.id;
  }, [options, optionRisk]);

  const addAssumption = async () => {
    if (!newAssumption.trim()) return;
    await db.DecisionAssumption.create({ decision_id: id, text: newAssumption.trim(), criticality: 'MEDIUM', status: 'holds' });
    setNewAssumption('');
    load();
  };
  const cycleAssumption = async (a) => {
    const order = ['holds', 'monitoring', 'invalidated'];
    const next = order[(order.indexOf(a.status) + 1) % order.length];
    await db.DecisionAssumption.update(a.id, { status: next });
    setAssumptions(prev => prev.map(x => x.id === a.id ? { ...x, status: next } : x));
  };
  const cycleCriticality = async (a) => {
    const order = ['LOW', 'MEDIUM', 'HIGH'];
    const next = order[(order.indexOf(a.criticality) + 1) % order.length];
    await db.DecisionAssumption.update(a.id, { criticality: next });
    setAssumptions(prev => prev.map(x => x.id === a.id ? { ...x, criticality: next } : x));
  };
  const removeAssumption = async (aid) => { await db.DecisionAssumption.delete(aid); load(); };

  const runOption = (opt) => navigate(`/sessions/new?decision=${id}&option=${opt.id}`);

  const recordDecision = async (chosenOptionId) => {
    await db.Decision.update(id, {
      status: 'decided', chosen_option_id: chosenOptionId,
      decision_rationale: rationale, decided_by: decidedBy,
      decided_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    setRecordOpen(false);
    load();
  };

  if (loading) return <div className="p-6"><div className="h-40 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} /></div>;
  if (!decision) return <div className="p-6 text-sm" style={{ color: 'var(--wr-text-muted)' }}>Decision not found.</div>;

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b sticky top-0 z-20" style={{ backgroundColor: 'var(--wr-bg-primary)', borderColor: 'var(--wr-border)' }}>
        <Link to="/decisions" className="text-xs flex items-center gap-1 mb-2" style={{ color: 'var(--wr-text-muted)' }}><ArrowLeft className="w-3 h-3" /> Decisions</Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--wr-text-primary)' }}>{decision.title}</h1>
            {decision.description && <p className="text-sm mt-1" style={{ color: 'var(--wr-text-secondary)', maxWidth: 720 }}>{decision.description}</p>}
            {decision.acceptance_criteria && (
              <p className="text-xs mt-2" style={{ color: 'var(--wr-text-muted)' }}><span className="font-mono font-bold">ACCEPTANCE: </span>{decision.acceptance_criteria}</p>
            )}
          </div>
          {decision.status !== 'decided' && (
            <WrButton onClick={() => setRecordOpen(true)} disabled={!recommended}><Trophy className="w-4 h-4" /> Record Decision</WrButton>
          )}
        </div>
        {decision.status === 'decided' && (
          <div className="mt-3 rounded px-4 py-2 flex items-center gap-2" style={{ backgroundColor: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#27AE60' }} />
            <span className="text-sm" style={{ color: '#27AE60' }}>
              Decided: <strong>{options.find(o => o.id === decision.chosen_option_id)?.name || '—'}</strong>
              {decision.decided_by && ` · by ${decision.decided_by}`}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Option comparison */}
        <div>
          <h2 className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>OPTIONS — RISK COMPARISON</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)` }}>
            {options.map((opt, i) => {
              const { agg, sessionCount } = optionRisk[opt.id] || {};
              const isRec = recommended === opt.id;
              const isChosen = decision.chosen_option_id === opt.id;
              const band = agg ? riskBandFromScore(agg.peak) : null;
              return (
                <div key={opt.id} className="rounded-lg p-4 flex flex-col" style={{
                  backgroundColor: 'var(--wr-bg-card)',
                  border: `1px solid ${isChosen ? '#27AE60' : isRec ? 'rgba(240,165,0,0.5)' : 'var(--wr-border)'}`,
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>{String.fromCharCode(65 + i)}</span>
                    {isChosen && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#27AE60' }} title="Chosen" />}
                    {isRec && !isChosen && <span className="text-xs font-mono font-bold px-1.5 rounded" style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>LOWEST RISK</span>}
                  </div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--wr-text-primary)' }}>{opt.name}</p>
                  {opt.description && <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>{opt.description}</p>}

                  {agg ? (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono" style={{ color: band.color }}>{agg.peak}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>peak risk /25</span>
                      </div>
                      <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>avg exposure {agg.avgExposure} · {agg.count} SME ratings</p>
                      <div className="flex gap-1">
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => agg.severityCounts[s] > 0 && (
                          <span key={s} className="text-xs font-mono px-1 rounded" style={{ backgroundColor: `${SEV_COLORS[s]}1f`, color: SEV_COLORS[s] }}>{agg.severityCounts[s]}{s[0]}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs mb-3 italic" style={{ color: 'var(--wr-text-muted)' }}>Not analyzed yet — run a panel to score this option.</p>
                  )}

                  <div className="mt-auto space-y-1.5">
                    <button onClick={() => runOption(opt)} className="w-full text-xs font-mono font-bold py-1.5 rounded flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'rgba(240,165,0,0.12)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.3)' }}>
                      <Play className="w-3 h-3" /> Run panel for this option
                    </button>
                    {sessionCount > 0 && <p className="text-xs text-center font-mono" style={{ color: 'var(--wr-text-muted)' }}>{sessionCount} session{sessionCount !== 1 ? 's' : ''} linked</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assumptions */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <h2 className="text-xs font-bold tracking-widest font-mono mb-1" style={{ color: 'var(--wr-text-muted)' }}>KEY ASSUMPTIONS</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>The load-bearing assumptions this decision rests on. Click a status to cycle it — an invalidated assumption is a trigger to re-assess.</p>
          <div className="space-y-2 mb-3">
            {assumptions.length === 0 && <p className="text-xs italic" style={{ color: 'var(--wr-text-muted)' }}>No assumptions tracked yet.</p>}
            {assumptions.map(a => (
              <div key={a.id} className="flex items-center gap-2">
                <button onClick={() => cycleCriticality(a)} className="text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0" title="Criticality — click to cycle"
                  style={{ backgroundColor: `${CRIT_COLOR[a.criticality]}1f`, color: CRIT_COLOR[a.criticality], border: `1px solid ${CRIT_COLOR[a.criticality]}55`, width: 62 }}>
                  {a.criticality}
                </button>
                <button onClick={() => cycleAssumption(a)} className="text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1" title="Status — click to cycle"
                  style={{ backgroundColor: `${ASSUMPTION_STATUS[a.status]}1f`, color: ASSUMPTION_STATUS[a.status], border: `1px solid ${ASSUMPTION_STATUS[a.status]}55`, width: 104 }}>
                  {a.status === 'invalidated' && <AlertTriangle className="w-3 h-3" />}{a.status}
                </button>
                <span className="text-sm flex-1" style={{ color: 'var(--wr-text-secondary)', textDecoration: a.status === 'invalidated' ? 'line-through' : 'none' }}>{a.text}</span>
                <button onClick={() => removeAssumption(a.id)}><X className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} /></button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={newAssumption} onChange={e => setNewAssumption(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAssumption()}
              placeholder="Add an assumption this decision depends on…" className="flex-1 text-sm px-3 py-2 rounded outline-none"
              style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
            <WrButton variant="outline" onClick={addAssumption}><Plus className="w-3.5 h-3.5" /> Add</WrButton>
          </div>
        </div>

        {/* Linked sessions */}
        {sessions.length > 0 && (
          <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <h2 className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>ANALYSIS SESSIONS</h2>
            <div className="space-y-1.5">
              {sessions.map(s => {
                const opt = options.find(o => o.id === s.decision_option_id);
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`} className="flex items-center justify-between px-3 py-2 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', textDecoration: 'none' }}>
                    <span className="text-sm" style={{ color: 'var(--wr-text-primary)' }}>{s.name}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{opt ? `Option: ${opt.name}` : ''} · {s.status}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Record decision modal */}
      {recordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-[520px] rounded-lg p-6" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>RECORD DECISION</h2>
              <button onClick={() => setRecordOpen(false)}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>Which option are you choosing? This creates the durable decision record — including any risk you're knowingly accepting.</p>
            <div className="space-y-2 mb-4">
              {options.map((o, i) => {
                const agg = optionRisk[o.id]?.agg;
                return (
                  <button key={o.id} onClick={() => recordDecision(o.id)} className="w-full flex items-center gap-3 p-3 rounded text-left hover:bg-white/5"
                    style={{ backgroundColor: 'var(--wr-bg-secondary)', border: `1px solid ${recommended === o.id ? 'rgba(240,165,0,0.4)' : 'var(--wr-border)'}` }}>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--wr-amber)' }}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm flex-1" style={{ color: 'var(--wr-text-primary)' }}>{o.name}</span>
                    {agg && <span className="text-xs font-mono" style={{ color: riskBandFromScore(agg.peak).color }}>peak {agg.peak}</span>}
                    {recommended === o.id && <span className="text-xs font-mono" style={{ color: 'var(--wr-amber)' }}>lowest risk</span>}
                  </button>
                );
              })}
            </div>
            <input value={decidedBy} onChange={e => setDecidedBy(e.target.value)} placeholder="Decided by (name / role)" className="w-full text-sm px-3 py-2 rounded outline-none mb-2" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
            <textarea value={rationale} onChange={e => setRationale(e.target.value)} rows={3} placeholder="Rationale — why this option, and what risk is being knowingly accepted…" className="w-full text-sm px-3 py-2 rounded outline-none resize-none" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
            <p className="text-xs mt-3" style={{ color: 'var(--wr-text-muted)' }}>Click an option above to record it as the decision.</p>
          </div>
        </div>
      )}
    </div>
  );
}
