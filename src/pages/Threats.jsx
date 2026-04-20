import { useState, useEffect } from 'react';
import { generateThreats as generateThreatsLLM } from '@/lib/llm';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { AlertTriangle, Plus, X, Sparkles, Trash2, Edit2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WrButton from '@/components/ui/WrButton';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { WrInput, WrSelect } from '@/components/ui/WrInput';

const SEVERITIES = ['CRITICAL','HIGH','MEDIUM','LOW'];
const SEV_COLORS = { CRITICAL:'#C0392B', HIGH:'#D68910', MEDIUM:'#2E86AB', LOW:'#27AE60' };

function ThreatModal({ threat, domains, scenarios, onSave, onClose }) {
  const [form, setForm] = useState({ name:'', description:'', severity:'HIGH', domain_id:'', scenario_id:'', category:'', tags:[], ...threat });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:'rgba(0,0,0,0.7)' }}>
      <div className="w-[560px] max-h-[90vh] overflow-y-auto rounded-lg p-6" style={{ backgroundColor:'var(--wr-bg-card)', border:'1px solid var(--wr-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color:'var(--wr-amber)' }}>
            {threat?.id ? 'EDIT THREAT' : 'NEW THREAT'}
          </h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color:'var(--wr-text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <WrInput label="NAME" value={form.name} onChange={v => set('name',v)} placeholder="Threat name" />
          <WrInput label="DESCRIPTION" value={form.description} onChange={v => set('description',v)} rows={3} placeholder="Describe this threat..." />
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color:'var(--wr-text-secondary)' }}>SEVERITY</label>
            <div className="flex gap-2">
              {SEVERITIES.map(s => (
                <button key={s} onClick={() => set('severity',s)}
                  className="px-3 py-1.5 rounded text-xs font-bold font-mono transition-all"
                  style={{ backgroundColor: form.severity===s ? SEV_COLORS[s] : `${SEV_COLORS[s]}22`, color: form.severity===s ? '#fff' : SEV_COLORS[s] }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <WrSelect label="DOMAIN" value={form.domain_id} onChange={v => set('domain_id',v)}>
            <option value="">Select domain...</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </WrSelect>
          <WrSelect label="SCENARIO (optional)" value={form.scenario_id} onChange={v => set('scenario_id',v)}>
            <option value="">None</option>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </WrSelect>
          <WrInput label="CATEGORY" value={form.category} onChange={v => set('category',v)} placeholder="e.g. Supply Chain, Cyber, HUMINT..." />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
          <WrButton onClick={() => onSave(form)}>Save Threat</WrButton>
        </div>
      </div>
    </div>
  );
}

function AiGenerateModal({ scenarios, domains, onGenerated, onClose }) {
  const [scenarioId, setScenarioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const generate = async () => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    setLoading(true);
    try {
      const res = await generateThreatsLLM({ scenarioContext: scenario.context_document, scenarioName: scenario.name });
      setGenerated(res.threats || []);
      setSelected(new Set(res.threats?.map((_,i) => i) || []));
    } finally { setLoading(false); }
  };

  const save = async () => {
    const toSave = generated.filter((_,i) => selected.has(i));
    onGenerated(toSave, scenarioId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:'rgba(0,0,0,0.7)' }}>
      <div className="w-[640px] max-h-[90vh] overflow-y-auto rounded-lg p-6" style={{ backgroundColor:'var(--wr-bg-card)', border:'1px solid var(--wr-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color:'var(--wr-amber)' }}>AI GENERATE THREATS</h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color:'var(--wr-text-muted)' }} /></button>
        </div>
        {generated.length === 0 ? (
          <div className="space-y-4">
            <WrSelect label="SELECT SCENARIO" value={scenarioId} onChange={setScenarioId}>
              <option value="">Choose a scenario...</option>
              {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </WrSelect>
            <WrButton onClick={generate} disabled={!scenarioId || loading} className="w-full justify-center">
              <Sparkles className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Threats'}
            </WrButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color:'var(--wr-text-muted)' }}>Select threats to save:</p>
            {generated.map((t,i) => (
              <div key={i} onClick={() => {
                const s = new Set(selected);
                s.has(i) ? s.delete(i) : s.add(i);
                setSelected(s);
              }} className="p-3 rounded cursor-pointer transition-all" style={{
                backgroundColor: selected.has(i) ? 'rgba(240,165,0,0.08)' : 'var(--wr-bg-secondary)',
                border: `1px solid ${selected.has(i) ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color:'var(--wr-text-primary)' }}>{t.name}</span>
                  <SeverityBadge severity={t.severity} />
                </div>
                <p className="text-xs mt-1" style={{ color:'var(--wr-text-secondary)' }}>{t.description}</p>
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
              <WrButton onClick={save}>Save {selected.size} Selected</WrButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Threats() {
  const { db } = useWorkspace();
  const [threats, setThreats] = useState([]);
  const [domains, setDomains] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [modal, setModal] = useState(null);
  const [aiModal, setAiModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterSev, setFilterSev] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const load = async () => {
    if (!db) return;
    const [t,d,s] = await Promise.all([db.Threat.list('-created_date', 500), db.Domain.list('-created_date', 500), db.Scenario.list('-created_date', 500)]);
    setThreats(t); setDomains(d); setScenarios(s); setLoading(false);
  };

  useEffect(() => { load(); }, [db]);

  const handleSave = async (form) => {
    if (form.id) await db.Threat.update(form.id, form);
    else await db.Threat.create(form);
    setModal(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this threat?')) return;
    await db.Threat.delete(id);
    load();
  };

  const handleAiGenerated = async (list, scenarioId) => {
    for (const t of list) await db.Threat.create({ ...t, scenario_id: scenarioId });
    setAiModal(false); load();
  };

  const domainById = id => domains.find(d => d.id === id);
  const categories = [...new Set(threats.map(t => t.category).filter(Boolean))].sort();
  const filtered = threats.filter(t =>
    (!filterSev || t.severity === filterSev) &&
    (!filterCategory || t.category === filterCategory)
  );

  return (
    <div style={{ backgroundColor:'var(--wr-bg-primary)', minHeight:'100vh' }}>
      <PageHeader
        icon={AlertTriangle}
        title="THREATS"
        subtitle="Adversary tactics, vulnerabilities, and crisis events"
        actions={
          <div className="flex gap-2">
            <WrButton variant="outline" onClick={() => setAiModal(true)}><Sparkles className="w-4 h-4" /> AI Generate</WrButton>
            <WrButton onClick={() => setModal('new')}><Plus className="w-4 h-4" /> New Threat</WrButton>
          </div>
        }
      />

      <div className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor:'var(--wr-border)' }}>
        {['','CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
          <button key={s} onClick={() => setFilterSev(s)} className="px-3 py-1 rounded text-xs font-mono font-bold transition-all"
            style={{ backgroundColor: filterSev===s ? (s ? SEV_COLORS[s] : 'var(--wr-amber)') : 'var(--wr-bg-card)',
              color: filterSev===s ? (s ? '#fff' : '#0D1B2A') : 'var(--wr-text-secondary)',
              border: `1px solid ${filterSev===s ? 'transparent' : 'var(--wr-border)'}` }}>
            {s || 'ALL'}
          </button>
        ))}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--wr-border)' }} />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-1 text-xs rounded outline-none font-mono"
          style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: filterCategory ? 'var(--wr-amber)' : 'var(--wr-text-secondary)' }}
        >
          <option value="">ALL CATEGORIES</option>
          {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-6 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded animate-pulse" style={{ backgroundColor:'var(--wr-bg-card)' }} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No threats" description="Threats catalog known adversary tactics and vulnerabilities." action={() => setModal('new')} actionLabel="Create Threat" />
      ) : (
        <div className="p-4">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '58%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="text-left">
                {[
                  { label: 'Name', align: 'text-left' },
                  { label: 'Severity', align: 'text-left' },
                  { label: 'Category', align: 'text-left' },
                  { label: 'Actions', align: 'text-center' },
                ].map(h => (
                  <th key={h.label} className={`pb-3 text-xs font-bold tracking-widest font-mono ${h.align}`} style={{ color:'var(--wr-text-muted)' }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const dom = domainById(t.domain_id);
                return (
                  <tr key={t.id} className="border-t align-top" style={{ borderColor:'var(--wr-border)' }}>
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium break-words" style={{ color:'var(--wr-text-primary)' }}>{t.name}</p>
                      {t.description && <p className="text-xs mt-0.5 break-words" style={{ color:'var(--wr-text-muted)' }}>{t.description}</p>}
                    </td>
                    <td className="py-3 pr-4"><SeverityBadge severity={t.severity} /></td>
                    <td className="py-3 pr-4">
                      <span className="text-xs break-words" style={{ color:'var(--wr-text-secondary)' }}>{t.category}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setModal(t)} className="p-1.5 rounded hover:bg-white/5">
                          <Edit2 className="w-3.5 h-3.5" style={{ color:'var(--wr-text-muted)' }} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-white/5">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ThreatModal threat={modal==='new'?null:modal} domains={domains} scenarios={scenarios} onSave={handleSave} onClose={() => setModal(null)} />}
      {aiModal && <AiGenerateModal scenarios={scenarios} domains={domains} onGenerated={handleAiGenerated} onClose={() => setAiModal(false)} />}
    </div>
  );
}