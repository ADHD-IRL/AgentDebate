import { useState } from 'react';
import { X, Sparkles, Loader2, SlidersHorizontal, Volume2 } from 'lucide-react';
import WrButton from '@/components/ui/WrButton';
import { WrInput, WrSelect } from '@/components/ui/WrInput';
import { generateAgent as generateAgentLLM } from '@/lib/llm';
import { DEFAULT_VOICES } from '@/lib/voice';

const SEVERITIES = ['CRITICAL','HIGH','MEDIUM','LOW'];
const SEV_COLORS = { CRITICAL:'#C0392B', HIGH:'#D68910', MEDIUM:'#2E86AB', LOW:'#27AE60' };

const VOICE_META = {
  alloy:   { label: 'Alloy',   desc: 'Neutral · balanced' },
  echo:    { label: 'Echo',    desc: 'Male · clear' },
  nova:    { label: 'Nova',    desc: 'Female · warm' },
  onyx:    { label: 'Onyx',   desc: 'Male · deep' },
  fable:   { label: 'Fable',  desc: 'Expressive · storytelling' },
  shimmer: { label: 'Shimmer', desc: 'Female · soft' },
};

export default function AgentFormModal({ agent, mode: initialMode, domains, onSave, onClose }) {
  const [mode, setMode] = useState(initialMode || (agent ? 'manual' : 'manual'));
  const [form, setForm] = useState({
    name:'', discipline:'', domain_id:'', persona_description:'', cognitive_bias:'',
    red_team_focus:'', professional_background:'', expertise_level:'Senior',
    reasoning_style:'Analytical', severity_default:'HIGH', vector_human:50,
    vector_technical:50, vector_physical:30, vector_futures:40, is_ai_generated:false, tags:[],
    voice_id: '',
    ...agent
  });
  const [aiForm, setAiForm] = useState({ domain_id: '', expert_type:'', prior_background:'', key_focus:'', bias_toward:'' });
  const [generating, setGenerating] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const setAi = (k,v) => setAiForm(f => ({...f,[k]:v}));

  const generateAgent = async () => {
    setGenerating(true);
    try {
      const data = await generateAgentLLM(aiForm);
      setForm(f => ({ ...f, ...data, is_ai_generated: true, domain_id: aiForm.domain_id || f.domain_id, name: aiForm.name || data.name || f.name }));
      setMode('manual');
    } finally { setGenerating(false); }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      set('tags', [...(form.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-[680px] max-h-[92vh] overflow-y-auto rounded-lg" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
              {agent?.id ? 'EDIT AGENT' : 'NEW AGENT'}
            </h2>
            {!agent?.id && (
              <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
                {['manual','ai'].map(m => (
                  <button key={m} onClick={() => setMode(m)} className="px-3 py-1 text-xs font-medium transition-colors"
                    style={{ backgroundColor: mode===m ? 'var(--wr-amber)' : 'transparent', color: mode===m ? '#0D1B2A' : 'var(--wr-text-secondary)' }}>
                    {m === 'manual' ? 'Manual' : 'AI Generate'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>

        <div className="p-6">
          {mode === 'ai' && !agent?.id ? (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Describe the expert you want and Claude will generate a full profile.</p>
              <WrInput label="AGENT NAME" value={aiForm.name || ''} onChange={v => setAi('name',v)} placeholder="e.g. Maritime Security Specialist, Supply Chain Economist..." />
              <WrSelect label="DOMAIN" value={aiForm.domain_id} onChange={v => setAi('domain_id',v)}>
                <option value="">Select domain...</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </WrSelect>
              <WrInput label="EXPERT TYPE" value={aiForm.expert_type} onChange={v => setAi('expert_type',v)} placeholder="e.g. maritime security expert, behavioral economist, former NSA analyst..." />
              <WrInput label="PRIOR BACKGROUND (optional)" value={aiForm.prior_background} onChange={v => setAi('prior_background',v)} placeholder="Career background hints..." />
              <WrInput label="KEY FOCUS AREA (optional)" value={aiForm.key_focus} onChange={v => setAi('key_focus',v)} placeholder="What do they prioritize..." />
              <WrInput label="KNOWN BIAS TOWARD (optional)" value={aiForm.bias_toward} onChange={v => setAi('bias_toward',v)} placeholder="What they tend to over or underweight..." />
              <WrButton onClick={generateAgent} disabled={!aiForm.expert_type || generating} className="w-full justify-center" size="lg">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Agent...</> : <><Sparkles className="w-4 h-4" /> Generate Agent</>}
              </WrButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>AGENT IDENTITY</p>
                <div className="grid grid-cols-2 gap-3">
                  <WrInput label="NAME" value={form.name} onChange={v => set('name',v)} placeholder="Agent name" className="col-span-2" />
                  <WrInput label="DISCIPLINE" value={form.discipline} onChange={v => set('discipline',v)} placeholder="e.g. Counterintelligence" />
                  <WrSelect label="DOMAIN" value={form.domain_id} onChange={v => set('domain_id',v)}>
                    <option value="">Select domain...</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </WrSelect>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>TAGS</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags?.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-secondary)' }}>
                        {t}
                        <button onClick={() => set('tags', form.tags.filter(x=>x!==t))} className="text-red-400 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key==='Enter' && addTag()} placeholder="Add tag..."
                      className="flex-1 px-2 py-1 text-xs rounded outline-none"
                      style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
                    <WrButton variant="secondary" size="xs" onClick={addTag}>Add</WrButton>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>PROFILE</p>
                <div className="space-y-3">
                  <WrInput label="PERSONA DESCRIPTION" value={form.persona_description} onChange={v => set('persona_description',v)} rows={3}
                    placeholder="Who is this expert, how do they think, what have they seen..." />
                  <WrInput label="COGNITIVE BIAS" value={form.cognitive_bias} onChange={v => set('cognitive_bias',v)} rows={2}
                    placeholder="What this expert systematically underweights or misses..." />
                  <WrInput label="RED-TEAM FOCUS" value={form.red_team_focus} onChange={v => set('red_team_focus',v)} rows={2}
                    placeholder="What this agent hunts for in any scenario..." />
                </div>
              </div>

              {/* Persona Tuning */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--wr-amber)' }} />
                  <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>PERSONA TUNING</p>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.2)' }}>influences LLM output</span>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--wr-text-muted)' }}>
                  These fields shape how this agent reasons and writes during session assessments.
                </p>
                <div className="space-y-3">
                  <WrInput label="PROFESSIONAL BACKGROUND" value={form.professional_background} onChange={v => set('professional_background',v)} rows={2}
                    placeholder="e.g. 15 years at NSA, then private sector threat intelligence. Led post-9/11 HUMINT reforms..." />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>EXPERTISE LEVEL</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Junior','Mid-Level','Senior','Principal','World-Class'].map(lvl => (
                          <button key={lvl} onClick={() => set('expertise_level', lvl)}
                            className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                            style={{
                              backgroundColor: form.expertise_level === lvl ? 'var(--wr-amber)' : 'var(--wr-bg-primary)',
                              color: form.expertise_level === lvl ? '#0D1B2A' : 'var(--wr-text-secondary)',
                              border: `1px solid ${form.expertise_level === lvl ? 'var(--wr-amber)' : 'var(--wr-border)'}`,
                            }}>
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>REASONING STYLE</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Analytical','Intuitive','Contrarian','Systematic','Probabilistic'].map(style => (
                          <button key={style} onClick={() => set('reasoning_style', style)}
                            className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                            style={{
                              backgroundColor: form.reasoning_style === style ? '#2E86AB' : 'var(--wr-bg-primary)',
                              color: form.reasoning_style === style ? '#fff' : 'var(--wr-text-secondary)',
                              border: `1px solid ${form.reasoning_style === style ? '#2E86AB' : 'var(--wr-border)'}`,
                            }}>
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>VECTOR WEIGHTS</p>
                <div className="space-y-3">
                  {['human','technical','physical','futures'].map(v => (
                    <div key={v} className="flex items-center gap-3">
                      <span className="text-xs w-20 flex-shrink-0 capitalize" style={{ color: 'var(--wr-text-secondary)' }}>{v}</span>
                      <input type="range" min={0} max={100} value={form[`vector_${v}`] || 0}
                        onChange={e => set(`vector_${v}`, parseInt(e.target.value))}
                        className="flex-1 accent-amber-500" />
                      <input type="number" min={0} max={100} value={form[`vector_${v}`] || 0}
                        onChange={e => set(`vector_${v}`, parseInt(e.target.value))}
                        className="w-12 px-2 py-1 text-xs text-center rounded outline-none"
                        style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>DEFAULT SEVERITY</p>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} onClick={() => set('severity_default',s)}
                      className="px-4 py-2 rounded text-xs font-bold font-mono transition-all"
                      style={{ backgroundColor: form.severity_default===s ? SEV_COLORS[s] : `${SEV_COLORS[s]}22`, color: form.severity_default===s ? (s==='HIGH'?'#0D1B2A':'#fff') : SEV_COLORS[s] }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-3.5 h-3.5" style={{ color: '#2E86AB' }} />
                  <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>VOICE</p>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(46,134,171,0.1)', color: '#2E86AB', border: '1px solid rgba(46,134,171,0.2)' }}>optional · TTS</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>
                  Pick an OpenAI voice for this agent. Requires an OpenAI API key in Settings.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_VOICES.map(v => {
                    const meta = VOICE_META[v];
                    const selected = form.voice_id === v;
                    return (
                      <button key={v} onClick={() => set('voice_id', selected ? '' : v)}
                        className="text-left px-3 py-2 rounded transition-all"
                        style={{
                          backgroundColor: selected ? 'rgba(46,134,171,0.12)' : 'var(--wr-bg-secondary)',
                          border: selected ? '1px solid rgba(46,134,171,0.4)' : '1px solid var(--wr-border)',
                        }}>
                        <div className="text-xs font-semibold" style={{ color: selected ? '#2E86AB' : 'var(--wr-text-primary)' }}>{meta.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{meta.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {!form.voice_id && (
                  <p className="text-xs mt-2" style={{ color: 'var(--wr-text-muted)', fontStyle: 'italic' }}>
                    No voice selected — debate room will auto-assign based on roster position.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {mode === 'manual' && (
          <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
            <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
            <WrButton onClick={() => onSave(form)}>Save Agent</WrButton>
          </div>
        )}
      </div>
    </div>
  );
}