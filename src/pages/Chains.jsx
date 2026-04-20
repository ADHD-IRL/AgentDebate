import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Link2, Plus, Sparkles, Trash2, Edit2, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WrButton from '@/components/ui/WrButton';
import { WrInput, WrSelect } from '@/components/ui/WrInput';
import ChainTimeline from '@/components/chains/ChainTimeline';

function ChainStepCard({ step, index, agents, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold font-mono" style={{ color: 'var(--wr-amber)' }}>STEP {step.step_number}</span>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} className="p-1 hover:bg-white/5 rounded text-xs" style={{ color: 'var(--wr-text-muted)' }}>↑</button>
          <button onClick={onMoveDown} className="p-1 hover:bg-white/5 rounded text-xs" style={{ color: 'var(--wr-text-muted)' }}>↓</button>
          <button onClick={onRemove} className="p-1 hover:bg-white/5 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>
      <div className="space-y-2">
        <select
          value={step.agent_id || ''}
          onChange={e => onUpdate({ ...step, agent_id: e.target.value, agent_label: agents.find(a=>a.id===e.target.value)?.name || step.agent_label })}
          className="w-full px-2 py-1.5 text-xs rounded outline-none"
          style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}
        >
          <option value="">Select agent from library...</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.discipline}</option>)}
        </select>
        {!step.agent_id && (
          <input value={step.agent_label || ''} onChange={e => onUpdate({ ...step, agent_label: e.target.value })} placeholder="Or type agent label..."
            className="w-full px-2 py-1.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
        )}
        <textarea value={step.step_text || ''} onChange={e => onUpdate({ ...step, step_text: e.target.value })} placeholder="Describe what happens in this step..." rows={3}
          className="w-full px-2 py-1.5 text-xs rounded outline-none resize-none"
          style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
      </div>
    </div>
  );
}

function ChainBuilderPanel({ chain, domains, scenarios, agents, onSave, onClose, mode: initialMode }) {
  const [form, setForm] = useState({ name:'', description:'', domain_id:'', scenario_id:'', tags:[], steps:[], is_ai_generated:false, ...chain });
  const [aiForm, setAiForm] = useState({ scenario_id:'', chain_type:'Multi-discipline attack chain', num_steps:5, focus_area:'' });
  const [mode, setMode] = useState(initialMode || 'manual');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setAi = (k,v) => setAiForm(f=>({...f,[k]:v}));

  const addStep = () => {
    const steps = [...(form.steps || [])];
    steps.push({ step_number: steps.length + 1, agent_id:'', agent_label:'', step_text:'' });
    set('steps', steps);
  };

  const updateStep = (i, s) => {
    const steps = [...form.steps];
    steps[i] = { ...s, step_number: i + 1 };
    set('steps', steps);
  };

  const removeStep = (i) => {
    const steps = form.steps.filter((_,idx) => idx !== i).map((s,idx) => ({...s, step_number:idx+1}));
    set('steps', steps);
  };

  const moveStep = (i, dir) => {
    const steps = [...form.steps];
    const target = i + dir;
    if (target < 0 || target >= steps.length) return;
    [steps[i], steps[target]] = [steps[target], steps[i]];
    set('steps', steps.map((s,idx) => ({...s, step_number:idx+1})));
  };

  const generateChain = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const scenario = scenarios.find(s => s.id === aiForm.scenario_id);
      const res = await base44.functions.invoke('generateChain', {
        ...aiForm,
        scenarioContext: scenario?.context_document || '',
        agentList: agents.map(a => ({ name: a.name, discipline: a.discipline }))
      });
      if (res.data?.error) {
        setGenError(res.data.error);
      } else {
        const data = res.data;
        setForm(f => ({
          ...f,
          name: data.name || f.name,
          description: data.description || f.description,
          steps: data.steps || [],
          is_ai_generated: true,
          scenario_id: aiForm.scenario_id,
        }));
        setMode('manual');
      }
    } catch (e) {
      setGenError(e.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-[800px] max-h-[92vh] overflow-y-auto rounded-lg" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
              {chain?.id ? 'EDIT CHAIN' : 'BUILD CHAIN'}
            </h2>
            {!chain?.id && (
              <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
                {['manual','ai'].map(m => (
                  <button key={m} onClick={() => setMode(m)} className="px-3 py-1 text-xs font-medium transition-colors"
                    style={{ backgroundColor: mode===m ? 'var(--wr-amber)' : 'transparent', color: mode===m ? '#0D1B2A' : 'var(--wr-text-secondary)' }}>
                    {m==='manual' ? 'Manual Builder' : 'AI Generator'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>

        <div className="p-6">
          {mode === 'ai' ? (
            <div className="space-y-4">
              <WrSelect label="SCENARIO" value={aiForm.scenario_id} onChange={v => setAi('scenario_id',v)}>
                <option value="">Select scenario...</option>
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </WrSelect>
              <WrSelect label="CHAIN TYPE" value={aiForm.chain_type} onChange={v => setAi('chain_type',v)}>
                {['Multi-discipline attack chain','Escalation scenario','Supply chain compromise path','Influence & perception chain','Economic cascade chain'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </WrSelect>
              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>NUMBER OF STEPS: {aiForm.num_steps}</label>
                <input type="range" min={3} max={10} value={aiForm.num_steps} onChange={e => setAi('num_steps', parseInt(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <WrInput label="FOCUS AREA (optional)" value={aiForm.focus_area} onChange={v => setAi('focus_area',v)} placeholder="e.g. design phase, LNG market..." />
              {genError && (
                <div className="flex items-start gap-2 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
                  <span className="font-bold flex-shrink-0">Error:</span> {genError}
                </div>
              )}
              <WrButton onClick={generateChain} disabled={generating} className="w-full justify-center" size="lg">
                {generating ? <><span className="animate-pulse">Generating Chain...</span></> : <><Sparkles className="w-4 h-4" /> Generate Chain</>}
              </WrButton>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <WrInput label="CHAIN NAME" value={form.name} onChange={v => set('name',v)} placeholder="Chain name..." />
                <WrSelect label="DOMAIN" value={form.domain_id} onChange={v => set('domain_id',v)}>
                  <option value="">Select domain...</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </WrSelect>
                <WrSelect label="SCENARIO (optional)" value={form.scenario_id} onChange={v => set('scenario_id',v)}>
                  <option value="">None</option>
                  {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </WrSelect>
                <WrInput label="DESCRIPTION" value={form.description} onChange={v => set('description',v)} rows={3} placeholder="What does this chain represent..." />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>STEPS</p>
                    <WrButton variant="secondary" size="xs" onClick={addStep}><Plus className="w-3 h-3" /> Add Step</WrButton>
                  </div>
                  <div className="space-y-3">
                    {form.steps?.map((step, i) => (
                      <ChainStepCard key={i} step={step} index={i} agents={agents}
                        onUpdate={s => updateStep(i, s)}
                        onRemove={() => removeStep(i)}
                        onMoveUp={() => moveStep(i, -1)}
                        onMoveDown={() => moveStep(i, 1)}
                      />
                    ))}
                    {form.steps?.length === 0 && (
                      <div className="text-center py-6 rounded" style={{ border: '1px dashed var(--wr-border)' }}>
                        <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>No steps yet. Click "Add Step" to begin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div>
                <p className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>CHAIN PREVIEW</p>
                <div className="space-y-2">
                  {form.steps?.map((step, i) => (
                    <div key={i}>
                      <div className="p-3 rounded text-xs" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
                        <span className="font-bold font-mono" style={{ color: 'var(--wr-amber)' }}>STEP {step.step_number} </span>
                        <span style={{ color: 'var(--wr-text-secondary)' }}>{step.agent_label || agents.find(a=>a.id===step.agent_id)?.name || '—'}</span>
                        {step.step_text && <p className="mt-1 line-clamp-2" style={{ color: 'var(--wr-text-muted)' }}>{step.step_text}</p>}
                      </div>
                      {i < form.steps.length - 1 && (
                        <div className="flex justify-center py-1"><ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--wr-amber)' }} /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {mode === 'manual' && (
          <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
            <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
            <WrButton onClick={() => onSave(form)}>Save Chain</WrButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chains() {
  const { db, workspace } = useWorkspace();
  const [chains, setChains] = useState([]);
  const [domains, setDomains] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('manual');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!db) return;
    const [c,d,s,a] = await Promise.all([db.Chain.list(), db.Domain.list(), db.Scenario.list(), db.Agent.list()]);
    setChains(c); setDomains(d); setScenarios(s); setAgents(a); setLoading(false);
  };

  useEffect(() => { load(); }, [db]);

  const handleSave = async (form) => {
    if (form.id) await db.Chain.update(form.id, form);
    else await db.Chain.create(form);
    setModal(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this chain?')) return;
    await db.Chain.delete(id);
    load();
  };

  const domainById = id => domains.find(d => d.id === id);
  const scenarioById = id => scenarios.find(s => s.id === id);
  const openNew = (m) => { setModalMode(m); setModal('new'); };
  const [expandedChain, setExpandedChain] = useState(null);

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Link2}
        title="CHAINS"
        subtitle="Compound multi-step threat and scenario sequences"
        actions={
          <div className="flex gap-2">
            <WrButton variant="outline" onClick={() => openNew('ai')}><Sparkles className="w-4 h-4" /> AI Generate</WrButton>
            <WrButton onClick={() => openNew('manual')}><Plus className="w-4 h-4" /> Build Chain</WrButton>
          </div>
        }
      />

      {loading ? (
        <div className="p-6 grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-36 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} />)}
        </div>
      ) : chains.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No chains yet"
          description="Chains are compound multi-step sequences that show how threats and scenarios unfold across disciplines. Build manually or generate from a scenario."
          action={() => openNew('manual')}
          actionLabel="Build First Chain"
        />
      ) : (
        <div className="p-6 grid grid-cols-2 gap-4">
          {chains.map(chain => {
            const dom = domainById(chain.domain_id);
            return (
              <div key={chain.id} className="rounded overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="h-1" style={{ backgroundColor: dom?.color || '#F0A500' }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{chain.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{chain.description}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {chain.is_ai_generated && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(123,45,139,0.2)', color: '#9B59B6' }}>AI</span>}
                      <button onClick={() => setModal(chain)} className="p-1.5 rounded hover:bg-white/5"><Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} /></button>
                      <button onClick={() => handleDelete(chain.id)} className="p-1.5 rounded hover:bg-white/5"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {(chain.steps || []).slice(0,5).map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-secondary)', border: '1px solid var(--wr-border)' }}>
                          {step.agent_label || `Step ${step.step_number}`}
                        </span>
                        {i < Math.min((chain.steps?.length || 0), 5) - 1 && <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wr-amber)' }} />}
                      </div>
                    ))}
                    {(chain.steps?.length || 0) > 5 && <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>+{chain.steps.length - 5} more</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{chain.steps?.length || 0} steps</span>
                      {dom && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${dom.color}22`, color: dom.color }}>{dom.name}</span>}
                      {scenarioById(chain.scenario_id) && (
                        <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                          {scenarioById(chain.scenario_id).name}
                        </span>
                      )}
                    </div>
                    {(chain.steps?.length || 0) > 0 && (
                      <button
                        onClick={() => setExpandedChain(expandedChain === chain.id ? null : chain.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/5"
                        style={{ color: 'var(--wr-amber)' }}
                      >
                        {expandedChain === chain.id
                          ? <><ChevronUp className="w-3 h-3" /> Hide Timeline</>
                          : <><ChevronDown className="w-3 h-3" /> View Timeline</>
                        }
                      </button>
                    )}
                  </div>

                  {expandedChain === chain.id && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--wr-border)' }}>
                      <ChainTimeline chain={chain} agents={agents} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ChainBuilderPanel
          chain={modal === 'new' ? null : modal}
          domains={domains}
          scenarios={scenarios}
          agents={agents}
          mode={modal === 'new' ? modalMode : 'manual'}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}