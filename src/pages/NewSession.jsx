import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Swords, Plus, X, ChevronRight, Zap, BarChart2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import WrButton from '@/components/ui/WrButton';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { WrInput, WrSelect } from '@/components/ui/WrInput';

const MODES = [
  {
    id: 'classic',
    icon: BarChart2,
    label: 'Classic Analysis',
    description: 'Two-round structured assessment. Agents work independently, then rebuttal round produces a scored synthesis.',
    color: '#2E86AB',
  },
  {
    id: 'live',
    icon: Zap,
    label: 'Live Debate',
    description: 'Real-time streaming debate room. Watch agents think, interject with questions, and direct the conversation.',
    color: '#F0A500',
  },
];

export default function NewSession() {
  const { db } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [domains, setDomains] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: `Session ${new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`,
    domain_id: '',
    scenario_id: searchParams.get('scenario') || '',
    phase_focus: '',
    context_override: '',
    mode: searchParams.get('mode') === 'live' ? 'live' : 'classic',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  useEffect(() => {
    if (!db) return;
    Promise.all([
      db.Domain.list(),
      db.Scenario.list(),
      db.Agent.list(),
    ]).then(([d,s,a]) => { setDomains(d); setScenarios(s); setAgents(a); });
  }, [db]);

  const toggleAgent = (agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const selectedScenario = scenarios.find(s => s.id === form.scenario_id);
  const domainById = id => domains.find(d => d.id === id);
  const filteredAgents = agents.filter(a => !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.discipline?.toLowerCase().includes(search.toLowerCase()));

  const handleStart = async () => {
    if (!form.name || selectedAgents.length < 1) return;
    setSaving(true);
    const session = await db.Session.create({
      ...form,
      status: 'pending',
      agent_ids: selectedAgents.map(a => a.id),
    });
    for (const agent of selectedAgents) {
      await db.SessionAgent.create({ session_id: session.id, agent_id: agent.id, status: 'pending' });
    }
    if (form.mode === 'live') {
      navigate(`/sessions/${session.id}/live`);
    } else {
      navigate(`/sessions/${session.id}`);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Swords}
        title="NEW SESSION"
        subtitle="Configure and launch a WARROOM analysis session"
      />

      <div className="p-6 max-w-5xl mx-auto">

        {/* Mode picker */}
        <div className="mb-5">
          <p className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>SESSION MODE</p>
          <div className="grid grid-cols-2 gap-4">
            {MODES.map(mode => {
              const Icon = mode.icon;
              const isSelected = form.mode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => set('mode', mode.id)}
                  className="text-left p-4 rounded transition-all"
                  style={{
                    backgroundColor: isSelected ? `${mode.color}12` : 'var(--wr-bg-card)',
                    border: `2px solid ${isSelected ? mode.color : 'var(--wr-border)'}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${mode.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: mode.color }} />
                    </div>
                    <span className="text-sm font-bold font-mono" style={{ color: isSelected ? mode.color : 'var(--wr-text-primary)' }}>
                      {mode.label}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${mode.color}20`, color: mode.color }}>
                        SELECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-muted)' }}>
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Setup */}
        <div className="rounded p-5 mb-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <h2 className="text-xs font-bold tracking-widest mb-4 font-mono" style={{ color: 'var(--wr-text-muted)' }}>SESSION SETUP</h2>
          <div className="grid grid-cols-2 gap-4">
            <WrInput label="SESSION NAME" value={form.name} onChange={v => set('name',v)} className="col-span-2" />
            <WrSelect label="DOMAIN" value={form.domain_id} onChange={v => set('domain_id',v)}>
              <option value="">Select domain...</option>
              {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </WrSelect>
            <WrSelect label="SCENARIO" value={form.scenario_id} onChange={v => set('scenario_id',v)}>
              <option value="">Select scenario...</option>
              {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </WrSelect>
            <WrInput label="PHASE / FOCUS" value={form.phase_focus} onChange={v => set('phase_focus',v)} placeholder="e.g. Design Phase, Week 4..." className="col-span-2" />
          </div>
          {selectedScenario?.context_document && (
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
              <p className="text-xs font-bold font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>CONTEXT DOCUMENT PREVIEW</p>
              <p className="text-xs line-clamp-4" style={{ color: 'var(--wr-text-secondary)' }}>{selectedScenario.context_document}</p>
            </div>
          )}
        </div>

        {/* Agent Selection */}
        <div className="rounded p-5 mb-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>SELECT AGENTS</h2>
            <span className="text-xs" style={{ color: selectedAgents.length >= 3 ? '#27AE60' : 'var(--wr-amber)' }}>
              {selectedAgents.length} selected {selectedAgents.length < 3 && '(min 3)'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Library */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--wr-text-muted)' }}>AGENT LIBRARY</p>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
                className="w-full px-2 py-1.5 text-xs rounded mb-2 outline-none"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filteredAgents.map(agent => {
                  const dom = domainById(agent.domain_id);
                  const isSelected = selectedAgents.find(a => a.id === agent.id);
                  return (
                    <button key={agent.id} onClick={() => toggleAgent(agent)}
                      className="w-full text-left p-2 rounded flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: isSelected ? 'rgba(240,165,0,0.08)' : 'var(--wr-bg-secondary)',
                        border: `1px solid ${isSelected ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
                      }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{agent.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
                      </div>
                      {dom && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dom.color }} />}
                      <SeverityBadge severity={agent.severity_default} size="xs" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--wr-text-muted)' }}>SESSION AGENTS ({selectedAgents.length})</p>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {selectedAgents.length === 0 ? (
                  <div className="p-4 rounded text-center" style={{ border: '1px dashed var(--wr-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Click agents to add them</p>
                  </div>
                ) : (
                  selectedAgents.map((agent, i) => {
                    const dom = domainById(agent.domain_id);
                    return (
                      <div key={agent.id} className="p-2 rounded flex items-center gap-2"
                        style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(240,165,0,0.2)' }}>
                        <span className="text-xs font-mono w-5 flex-shrink-0" style={{ color: 'var(--wr-amber)' }}>{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{agent.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
                        </div>
                        {dom && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dom.color }} />}
                        <button onClick={() => toggleAgent(agent)} className="text-red-400 hover:text-red-300 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Launch */}
        <div className="flex justify-end">
          <WrButton
            size="lg"
            onClick={handleStart}
            disabled={saving || selectedAgents.length < 1 || !form.name}
            className="px-8"
          >
            {saving ? 'Creating...' : <><ChevronRight className="w-4 h-4" /> {form.mode === 'live' ? 'Enter Debate Room' : 'Start Session'}</>}
          </WrButton>
        </div>
      </div>
    </div>
  );
}
