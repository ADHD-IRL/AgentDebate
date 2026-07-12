import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Shield, Trash2, Search, TrendingDown } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { riskScore, riskBandFromScore, likelihoodLabel, impactLabel } from '@/lib/risk';

const STATUS = ['proposed', 'accepted', 'in_progress', 'implemented', 'verified', 'rejected'];
const STATUS_COLOR = {
  proposed: '#8A9BB5', accepted: '#2E86AB', in_progress: '#D68910',
  implemented: '#27AE60', verified: '#1E8449', rejected: '#C0392B',
};
const TYPE_COLOR = { PREVENTIVE: '#2E86AB', DETECTIVE: '#9B59B6', RESPONSIVE: '#D68910' };
const EFFORT_COLOR = { LOW: '#27AE60', MEDIUM: '#D68910', HIGH: '#C0392B' };

function BandPicker({ value, onChange, color, labelFn }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(value === n ? null : n)} title={labelFn(n)}
          className="w-5 h-5 rounded text-xs font-mono font-bold"
          style={{
            backgroundColor: value === n ? color : 'var(--wr-bg-secondary)',
            color: value === n ? '#fff' : 'var(--wr-text-muted)',
            border: '1px solid var(--wr-border)',
          }}>
          {n}
        </button>
      ))}
    </div>
  );
}

function RiskChip({ l, i }) {
  const score = riskScore(l, i);
  if (score == null) return <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>—</span>;
  const band = riskBandFromScore(score);
  return (
    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
      title={`${likelihoodLabel(l)} × ${impactLabel(i)}`}
      style={{ backgroundColor: `${band.color}18`, color: band.color, border: `1px solid ${band.color}40` }}>
      {score}
    </span>
  );
}

export default function Mitigations() {
  const { db } = useWorkspace();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    if (!db) return;
    const list = await db.Mitigation.list('-created_at');
    setItems(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, [db]);

  const patch = async (id, fields) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, ...fields } : m));
    await db.Mitigation.update(id, { ...fields, updated_at: new Date().toISOString() });
  };

  const remove = async (id) => {
    if (!confirm('Delete this mitigation?')) return;
    await db.Mitigation.delete(id);
    load();
  };

  const filtered = useMemo(() => items.filter(m =>
    (!sessionParam || m.session_id === sessionParam) &&
    (!statusFilter || m.status === statusFilter) &&
    (!search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.owner?.toLowerCase().includes(search.toLowerCase()))
  ), [items, statusFilter, search, sessionParam]);

  // Net risk reduction across mitigations that carry both inherent and residual scores
  const summary = useMemo(() => {
    const scored = items.filter(m => riskScore(m.inherent_likelihood, m.inherent_impact) != null && riskScore(m.residual_likelihood, m.residual_impact) != null && m.status !== 'rejected');
    const inherent = scored.reduce((s, m) => s + riskScore(m.inherent_likelihood, m.inherent_impact), 0);
    const residual = scored.reduce((s, m) => s + riskScore(m.residual_likelihood, m.residual_impact), 0);
    const active = items.filter(m => m.status !== 'rejected').length;
    const done = items.filter(m => m.status === 'implemented' || m.status === 'verified').length;
    return { count: scored.length, inherent, residual, reduction: inherent - residual, active, done };
  }, [items]);

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader icon={Shield} title="MITIGATIONS" subtitle="Track countermeasures and re-score residual risk after adoption" />

      {sessionParam && (
        <div className="px-6 pt-4">
          <Link to={`/sessions/${sessionParam}`} className="text-xs font-mono inline-flex items-center gap-1 px-2 py-1 rounded"
            style={{ color: 'var(--wr-amber)', backgroundColor: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', textDecoration: 'none' }}>
            ← Back to session · showing this session's mitigations
          </Link>
        </div>
      )}

      {/* Summary */}
      {!loading && items.length > 0 && (
        <div className="mx-6 mt-4 rounded px-5 py-3 flex items-center gap-6 flex-wrap" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <div><p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>TRACKED</p><p className="text-xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{summary.active}</p></div>
          <div><p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>IMPLEMENTED</p><p className="text-xl font-bold font-mono" style={{ color: '#27AE60' }}>{summary.done}</p></div>
          <div className="w-px h-8" style={{ backgroundColor: 'var(--wr-border)' }} />
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" style={{ color: '#27AE60' }} />
            <div>
              <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>NET RISK REDUCTION</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>
                {summary.inherent} → {summary.residual} <span className="text-sm" style={{ color: '#27AE60' }}>(−{summary.reduction})</span>
              </p>
            </div>
          </div>
          <p className="text-xs ml-auto" style={{ color: 'var(--wr-text-muted)', maxWidth: 260 }}>
            Summed inherent vs residual risk across {summary.count} scored mitigations (excludes rejected).
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="mx-6 mt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or owner…" className="text-xs bg-transparent outline-none" style={{ color: 'var(--wr-text-primary)', width: 200 }} />
        </div>
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
          <button onClick={() => setStatusFilter('')} className="text-xs font-mono px-2.5 py-1.5" style={{ backgroundColor: !statusFilter ? 'var(--wr-amber)' : 'transparent', color: !statusFilter ? '#0D1B2A' : 'var(--wr-text-muted)' }}>ALL</button>
          {STATUS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="text-xs font-mono px-2.5 py-1.5" style={{ backgroundColor: statusFilter === s ? STATUS_COLOR[s] : 'transparent', color: statusFilter === s ? '#fff' : 'var(--wr-text-muted)' }}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-6"><div className="h-40 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Shield} title="No mitigations tracked yet"
          description="Mitigations land here from the Chain Breaker — open a chain analysis and click 'Add to register' on any roadmap item." />
      ) : (
        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--wr-border)' }}>
                {['Mitigation', 'Type', 'Effort', 'Owner', 'Status', 'Inherent', 'Residual', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-mono font-bold" style={{ color: 'var(--wr-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--wr-border)' }}>
                  <td className="px-3 py-3" style={{ maxWidth: 320 }}>
                    <p className="font-medium" style={{ color: 'var(--wr-text-primary)' }}>{m.title}</p>
                    {m.effect && <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{m.effect}</p>}
                    {m.breaks_steps?.length > 0 && <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--wr-text-muted)' }}>breaks steps {m.breaks_steps.join(', ')}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {m.control_type && <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${TYPE_COLOR[m.control_type]}1f`, color: TYPE_COLOR[m.control_type] }}>{m.control_type}</span>}
                  </td>
                  <td className="px-3 py-3">
                    {m.effort && <span className="text-xs font-mono font-bold" style={{ color: EFFORT_COLOR[m.effort] }}>{m.effort}</span>}
                    {m.time_to_deploy && <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{m.time_to_deploy}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <input value={m.owner || ''} onChange={e => patch(m.id, { owner: e.target.value })} placeholder="—"
                      className="text-xs bg-transparent outline-none w-24" style={{ color: 'var(--wr-text-secondary)', borderBottom: '1px solid var(--wr-border)' }} />
                  </td>
                  <td className="px-3 py-3">
                    <select value={m.status} onChange={e => patch(m.id, { status: e.target.value })}
                      className="text-xs font-mono rounded px-1.5 py-1 outline-none"
                      style={{ backgroundColor: `${STATUS_COLOR[m.status]}1f`, color: STATUS_COLOR[m.status], border: `1px solid ${STATUS_COLOR[m.status]}55` }}>
                      {STATUS.map(s => <option key={s} value={s} style={{ backgroundColor: 'var(--wr-bg-card)', color: 'var(--wr-text-primary)' }}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3"><RiskChip l={m.inherent_likelihood} i={m.inherent_impact} /></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <RiskChip l={m.residual_likelihood} i={m.residual_impact} />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono" style={{ color: '#2E86AB' }} title="Residual likelihood">L</span>
                        <BandPicker value={m.residual_likelihood} onChange={v => patch(m.id, { residual_likelihood: v })} color="#2E86AB" labelFn={likelihoodLabel} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono" style={{ color: '#C0392B' }} title="Residual impact">I</span>
                        <BandPicker value={m.residual_impact} onChange={v => patch(m.id, { residual_impact: v })} color="#C0392B" labelFn={impactLabel} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => remove(m.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
