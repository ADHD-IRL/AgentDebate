import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateRound1, generateRound2, generateSynthesis as generateSynthesisLLM, extractSessionThreats } from '@/lib/llm';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, ChevronDown, ChevronUp, Sparkles, AlertCircle, Save, BarChart2, ShieldAlert, Check, X } from 'lucide-react';
import SeverityBadge from '@/components/ui/SeverityBadge';
import WrButton from '@/components/ui/WrButton';
import { WrInput } from '@/components/ui/WrInput';

const TABS = ['ROUND 1','ROUND 2','SYNTHESIS','THREATS','SETTINGS'];

const STATUS_COLOR = { pending:'#546E7A', round1:'#2E86AB', round2:'#D68910', complete:'#27AE60' };

function AgentAssessmentCard({ sa, agent, round, onGenerate, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const isGenerating = sa.status === (round === 1 ? 'generating_r1' : 'generating_r2');
  const text = round === 1 ? sa.round1_assessment : sa.round2_rebuttal;
  const severity = round === 1 ? sa.round1_severity : sa.round2_revised_severity;
  const color = agent?.domain_color || '#F0A500';

  return (
    <div className="rounded overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-mono" style={{ color }}>Agent {agent?.name}</p>
            <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{agent?.discipline}</p>
          </div>
          {severity && <SeverityBadge severity={severity} />}
        </div>

        {isGenerating ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--wr-amber)' }} />
            <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Generating assessment...</span>
          </div>
        ) : text ? (
          <div>
            {editing ? (
              <div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8}
                  className="w-full text-xs px-2 py-2 rounded outline-none resize-none"
                  style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
                <div className="flex gap-2 mt-2">
                  <WrButton size="xs" onClick={() => { onUpdate(editText); setEditing(false); }}>Save</WrButton>
                  <WrButton variant="secondary" size="xs" onClick={() => setEditing(false)}>Cancel</WrButton>
                </div>
              </div>
            ) : (
              <div>
                <div className={expanded ? '' : 'line-clamp-4'}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--wr-text-secondary)' }}>{text}</p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--wr-amber)' }}>
                  {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
              <WrButton variant="secondary" size="xs" onClick={() => { setEditText(text); setEditing(true); }}>Edit</WrButton>
              <WrButton variant="secondary" size="xs" onClick={onGenerate}><RefreshCw className="w-3 h-3" /> Regen</WrButton>
            </div>
          </div>
        ) : (
          <div className="py-3">
            <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>No assessment yet</p>
            <WrButton size="xs" onClick={onGenerate}>Generate</WrButton>
          </div>
        )}
      </div>
    </div>
  );
}

function SynthesisPanel({ synthesis, sessionId, onGenerate, generating, synthStatus }) {
  const [resolvedText, setResolvedText] = useState('');

  useEffect(() => {
    if (!synthesis?.raw_text) return;
    const raw = synthesis.raw_text;
    if (raw.startsWith('http')) {
      fetch(raw).then(r => r.text()).then(setResolvedText);
    } else {
      setResolvedText(raw);
    }
  }, [synthesis?.raw_text]);

  if (!synthesis && !generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Sparkles className="w-10 h-10 mb-4" style={{ color: 'var(--wr-amber)' }} />
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--wr-text-primary)' }}>Generate Synthesis</h3>
        <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--wr-text-secondary)' }}>
          Complete Round 2 first, then generate the synthesis report.
        </p>
        <WrButton size="lg" onClick={onGenerate}>
          <Sparkles className="w-4 h-4" /> Generate Synthesis
        </WrButton>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg p-6" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: 'var(--wr-amber)' }} />
            <span className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>SYNTHESIS ENGINE RUNNING</span>
          </div>
          <div className="space-y-2">
            {[
              'Collecting agent assessments...',
              'Analyzing Round 1 assessments across all agents...',
              'Cross-referencing Round 2 rebuttals and severity shifts...',
              'Identifying consensus findings and contested positions...',
              'Mapping compound threat chains from agent interactions...',
              'Surfacing blind spots and uncovered threat vectors...',
              'Formulating priority mitigations...',
              'Extracting sharpest insights and attributions...',
              'Assembling final synthesis report...',
              'Uploading and storing synthesis output...',
            ].map((step, i) => {
              const isActive = synthStatus === step;
              const isDone = synthStatus && [
                'Collecting agent assessments...',
                'Analyzing Round 1 assessments across all agents...',
                'Cross-referencing Round 2 rebuttals and severity shifts...',
                'Identifying consensus findings and contested positions...',
                'Mapping compound threat chains from agent interactions...',
                'Surfacing blind spots and uncovered threat vectors...',
                'Formulating priority mitigations...',
                'Extracting sharpest insights and attributions...',
                'Assembling final synthesis report...',
                'Uploading and storing synthesis output...',
              ].indexOf(synthStatus) > i;
              return (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {isDone ? (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--wr-low)' }} />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--wr-amber)' }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--wr-border)' }} />
                    )}
                  </div>
                  <span className="text-xs font-mono" style={{
                    color: isDone ? 'var(--wr-low)' : isActive ? 'var(--wr-text-primary)' : 'var(--wr-text-muted)',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const printReport = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Synthesis Report</title>
      <style>
        body { font-family: Georgia, serif; max-width: 860px; margin: 60px auto; color: #1a1a1a; line-height: 1.8; font-size: 14px; }
        h1 { font-size: 26px; border-bottom: 3px solid #F0A500; padding-bottom: 10px; }
        h2 { font-size: 18px; color: #111; margin-top: 36px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
        p, pre { margin: 8px 0; white-space: pre-wrap; font-family: Georgia, serif; }
        .footer { margin-top: 60px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { body { margin: 30px; } }
      </style></head><body>
      <h1>Synthesis Report</h1>
      <pre style="font-family:Georgia,serif;font-size:14px;line-height:1.8;">${resolvedText}</pre>
      <div class="footer">Generated by AgentDebate — ${new Date().toLocaleDateString()}</div>
      <script>window.onload = function() { window.focus(); window.print(); };<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <WrButton variant="secondary" size="sm" onClick={() => window.history.back()}>
          ← Back
        </WrButton>
        {resolvedText && (
          <WrButton variant="outline" size="sm" onClick={printReport}>
            🖨 Print Report
          </WrButton>
        )}
      </div>
      {resolvedText && (
        <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--wr-text-secondary)', fontFamily: 'Inter, sans-serif' }}>
            {resolvedText}
          </pre>
        </div>
      )}
    </div>
  );
}

function SessionSettingsPanel({ session, sessionAgents, getAgent, onSaved }) {
  const { db } = useWorkspace();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: session.name || '', phase_focus: session.phase_focus || '', context_override: session.context_override || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await db.Session.update(session.id, form);
    setSaving(false);
    onSaved();
    navigate('/sessions');
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <h3 className="text-xs font-bold tracking-widest mb-4 font-mono" style={{ color: 'var(--wr-text-muted)' }}>SESSION DETAILS</h3>
        <div className="space-y-4">
          <WrInput label="NAME" value={form.name} onChange={v => set('name', v)} placeholder="Session name" />
          <WrInput label="PHASE FOCUS" value={form.phase_focus} onChange={v => set('phase_focus', v)} placeholder="e.g. Pre-launch risk assessment" />
          <WrInput label="CONTEXT OVERRIDE" value={form.context_override} onChange={v => set('context_override', v)} placeholder="Optional extra context appended to agent prompts..." rows={4} />
        </div>
        <div className="mt-4">
          <WrButton onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </WrButton>
        </div>
      </div>

      <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <h3 className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>AGENTS ({sessionAgents.length})</h3>
        <div className="space-y-1">
          {sessionAgents.map(sa => {
            const agent = getAgent(sa.agent_id);
            return (
              <div key={sa.id} className="flex items-center gap-2 text-xs py-1" style={{ color: 'var(--wr-text-secondary)' }}>
                <span className="font-medium">{agent?.name}</span>
                <span style={{ color: 'var(--wr-text-muted)' }}>— {agent?.discipline}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SessionWorkspace() {
  const { id } = useParams();
  const { db, workspace } = useWorkspace();
  const [session, setSession] = useState(null);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [synthesis, setSynthesis] = useState(null);
  const [tab, setTab] = useState('ROUND 1');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSynthesis, setGeneratingSynthesis] = useState(false);
  const [synthStatus, setSynthStatus] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [genError, setGenError] = useState(null);
  const [threats, setThreats] = useState([]);
  const [extractedThreats, setExtractedThreats] = useState(null); // null = not run, [] = run + empty, [...] = results
  const [extracting, setExtracting] = useState(false);
  const [savingThreats, setSavingThreats] = useState(false);
  const [selectedThreats, setSelectedThreats] = useState(new Set());

  const load = async () => {
    if (!db) return;
    const [sess, sa, ag, sc, synth] = await Promise.all([
      db.Session.filter({ id }),
      db.SessionAgent.filter({ session_id: id }),
      db.Agent.list(),
      db.Scenario.list(),
      db.SessionSynthesis.filter({ session_id: id }),
    ]);
    setSession(sess[0] || null);
    setSessionAgents(sa);
    setAgents(ag);
    setScenarios(sc);
    setSynthesis(synth[0] || null);
    // Load threats for the session's scenario
    const scenarioId = sess[0]?.scenario_id;
    if (scenarioId) {
      const t = await db.Threat.filter({ scenario_id: scenarioId });
      setThreats(t);
    }
  };

  useEffect(() => { load(); }, [id, db]);

  const getAgent = (agentId) => agents.find(a => a.id === agentId);
  const scenario = scenarios.find(s => s.id === session?.scenario_id);

  const generateRound = async (round) => {
    setGeneratingAll(true);
    setGenError(null);
    setProgress({ current: 0, total: sessionAgents.length });
    const others = round === 2 ? sessionAgents.filter(sa => sa.round1_assessment) : [];

    for (let i = 0; i < sessionAgents.length; i++) {
      const sa = sessionAgents[i];
      const agent = getAgent(sa.agent_id);
      if (!agent) continue;

      setProgress({ current: i + 1, total: sessionAgents.length });

      const statusKey = round === 1 ? 'generating_r1' : 'generating_r2';
      await db.SessionAgent.update(sa.id, { status: statusKey });

      const othersText = others
        .filter(o => o.agent_id !== sa.agent_id)
        .map(o => {
          const oAgent = getAgent(o.agent_id);
          return `=== ${oAgent?.name} (${oAgent?.discipline}) ===\n${o.round1_assessment}`;
        }).join('\n\n');

      const fn = round === 1 ? generateRound1 : generateRound2;
      const res = await fn({
        agent: { ...agent },
        scenarioContext: scenario?.context_document || '',
        phaseFocus: session?.phase_focus || '',
        othersAssessments: othersText,
        threatCatalog: threats,
      });

      const updates = round === 1 ? {
        round1_assessment: res.assessment,
        round1_severity: res.severity || agent.severity_default,
        status: 'r1_done',
      } : {
        round2_rebuttal: res.assessment,
        round2_revised_severity: res.severity || sa.round1_severity,
        status: 'complete',
      };

      await db.SessionAgent.update(sa.id, updates);

      if (i < sessionAgents.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    const newStatus = round === 1 ? 'round1' : 'round2';
    await db.Session.update(id, { status: newStatus });
    setGeneratingAll(false);
    setProgress({ current: 0, total: 0 });
    load();
  };

  const generateSingleAgent = async (sa, round) => {
    const agent = getAgent(sa.agent_id);
    if (!agent) return;
    setGenError(null);
    const statusKey = round === 1 ? 'generating_r1' : 'generating_r2';
    await db.SessionAgent.update(sa.id, { status: statusKey });
    setSessionAgents(prev => prev.map(s => s.id === sa.id ? { ...s, status: statusKey } : s));

    const others = round === 2 ? sessionAgents.filter(o => o.agent_id !== sa.agent_id && o.round1_assessment) : [];
    const othersText = others.map(o => {
      const oAgent = getAgent(o.agent_id);
      return `=== ${oAgent?.name} (${oAgent?.discipline}) ===\n${o.round1_assessment}`;
    }).join('\n\n');

    try {
      const fn2 = round === 1 ? generateRound1 : generateRound2;
      const res = await fn2({
        agent: { ...agent },
        scenarioContext: scenario?.context_document || '',
        phaseFocus: session?.phase_focus || '',
        othersAssessments: othersText,
        threatCatalog: threats,
      });

      const updates = round === 1 ? {
        round1_assessment: res.assessment,
        round1_severity: res.severity || agent.severity_default,
        status: 'r1_done',
      } : {
        round2_rebuttal: res.assessment,
        round2_revised_severity: res.severity || sa.round1_severity,
        status: 'complete',
      };

      await db.SessionAgent.update(sa.id, updates);
    } catch (e) {
      await db.SessionAgent.update(sa.id, { status: 'pending' });
      setGenError(e.message || 'Generation failed');
    }
    load();
  };

  const updateAgentText = async (sa, round, text) => {
    const field = round === 1 ? 'round1_assessment' : 'round2_rebuttal';
    await db.SessionAgent.update(sa.id, { [field]: text });
    load();
  };

  const generateSynthesis = async () => {
    setGeneratingSynthesis(true);
    setSynthStatus('Collecting agent assessments...');

    const SYNTH_STEPS = [
      { delay: 800,  msg: 'Analyzing Round 1 assessments across all agents...' },
      { delay: 2500, msg: 'Cross-referencing Round 2 rebuttals and severity shifts...' },
      { delay: 5000, msg: 'Identifying consensus findings and contested positions...' },
      { delay: 9000, msg: 'Mapping compound threat chains from agent interactions...' },
      { delay: 14000, msg: 'Surfacing blind spots and uncovered threat vectors...' },
      { delay: 19000, msg: 'Formulating priority mitigations...' },
      { delay: 24000, msg: 'Extracting sharpest insights and attributions...' },
      { delay: 29000, msg: 'Assembling final synthesis report...' },
      { delay: 34000, msg: 'Uploading and storing synthesis output...' },
    ];

    const timers = SYNTH_STEPS.map(({ delay, msg }) =>
      setTimeout(() => setSynthStatus(msg), delay)
    );

    try {
      const res = await generateSynthesisLLM({
        session: { ...session },
        sessionAgents: sessionAgents.map(sa => ({
          ...sa,
          agentName: getAgent(sa.agent_id)?.name,
          discipline: getAgent(sa.agent_id)?.discipline,
        })),
        scenarioContext: scenario?.context_document || '',
      });

      const existing = synthesis;
      const synthData = {
        raw_text: res.synthesis,
        session_id: id,
        compound_chains: res.compound_chains || [],
      };
      if (existing?.id) {
        await db.SessionSynthesis.update(existing.id, synthData);
      } else {
        await db.SessionSynthesis.create(synthData);
      }
      await db.Session.update(id, { status: 'complete' });
      setSynthStatus('Complete.');
      load();
    } finally {
      timers.forEach(clearTimeout);
      setGeneratingSynthesis(false);
      setSynthStatus('');
    }
  };

  const handleExtractThreats = async () => {
    setExtracting(true);
    setExtractedThreats(null);
    try {
      const results = await extractSessionThreats({
        sessionAgents: sessionAgents.map(sa => ({
          ...sa,
          agentName: getAgent(sa.agent_id)?.name,
          discipline: getAgent(sa.agent_id)?.discipline,
        })),
        scenarioName: scenario?.name || '',
        scenarioContext: scenario?.context_document || '',
      });
      setExtractedThreats(results);
      setSelectedThreats(new Set(results.map((_, i) => i)));
    } catch {
      setExtractedThreats([]);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveThreats = async () => {
    if (!extractedThreats || selectedThreats.size === 0) return;
    setSavingThreats(true);
    try {
      const toSave = extractedThreats.filter((_, i) => selectedThreats.has(i));
      for (const t of toSave) {
        await db.Threat.create({
          scenario_id: session.scenario_id,
          name: t.name,
          description: t.description,
          severity: t.severity,
          category: t.category,
          tags: [],
        });
      }
      setExtractedThreats(null);
      setSelectedThreats(new Set());
      load();
    } finally {
      setSavingThreats(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--wr-amber)' }} />
      </div>
    );
  }

  const statusConfig = { pending:'#546E7A', round1:'#2E86AB', round2:'#D68910', complete:'#27AE60' };
  const statusColor = statusConfig[session.status] || '#546E7A';
  const round = tab === 'ROUND 1' ? 1 : 2;

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      {/* Top Bar */}
      <div className="border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
        <Link to="/sessions" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-text-muted)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Sessions
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold" style={{ color: 'var(--wr-text-primary)' }}>{session.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded font-bold font-mono" style={{ backgroundColor: `${statusColor}22`, color: statusColor }}>
              {session.status?.toUpperCase()}
            </span>
          </div>
          {session.phase_focus && <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{session.phase_focus}</p>}
        </div>
        <div className="flex items-center gap-2">
          {session.mode === 'live' && (
            <Link to={`/sessions/${id}/live`}>
              <WrButton size="sm" style={{ backgroundColor: 'rgba(46,134,171,0.15)', borderColor: 'rgba(46,134,171,0.4)', color: '#2E86AB' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2E86AB', display: 'inline-block', marginRight: 4 }} />
                Enter Debate Room
              </WrButton>
            </Link>
          )}
          <Link to={`/sessions/${id}/results`}>
            <WrButton variant="outline" size="sm"><BarChart2 className="w-3.5 h-3.5" /> Results</WrButton>
          </Link>
          {(tab === 'ROUND 1' || tab === 'ROUND 2') && (
            <WrButton
              size="sm"
              onClick={() => generateRound(round)}
              disabled={generatingAll}
            >
              {generatingAll ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress.current}/{progress.total}</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate All {tab === 'ROUND 1' ? 'Round 1' : 'Round 2'}</>
              )}
            </WrButton>
          )}
          {tab === 'SYNTHESIS' && (
            <WrButton size="sm" onClick={generateSynthesis} disabled={generatingSynthesis}>
              <Sparkles className="w-3.5 h-3.5" /> {generatingSynthesis ? 'Generating...' : 'Generate Synthesis'}
            </WrButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--wr-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-6 py-3 text-xs font-bold tracking-widest font-mono transition-colors"
            style={{
              color: tab === t ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
              borderBottom: tab === t ? '2px solid var(--wr-amber)' : '2px solid transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Unrun banner — pending sessions that haven't been started yet */}
        {session.status === 'pending' && (
          <div className="mb-5 rounded p-4 flex items-center gap-4"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px dashed var(--wr-border)' }}>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest font-mono mb-1" style={{ color: 'var(--wr-text-muted)' }}>
                SESSION NOT STARTED
              </p>
              <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                {session.mode === 'live'
                  ? 'This session is ready. Enter the debate room to begin live AI moderation.'
                  : 'This session is ready. Generate Round 1 assessments from the tabs below to begin.'}
              </p>
            </div>
            {session.mode === 'live' ? (
              <Link to={`/sessions/${id}/live`}>
                <WrButton>Enter Debate Room</WrButton>
              </Link>
            ) : (
              <WrButton onClick={() => { setTab('ROUND 1'); }}>
                Start Round 1
              </WrButton>
            )}
          </div>
        )}

        {(tab === 'ROUND 1' || tab === 'ROUND 2') && (
          <>
            {genError && (
              <div className="mb-4 rounded p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold mb-0.5">Generation Failed</p>
                  <p className="text-xs">{genError}</p>
                </div>
                <button onClick={() => setGenError(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
              </div>
            )}
            {generatingAll && progress.total > 0 && (
              <div className="mb-4 rounded p-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>Generating {tab}...</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--wr-amber)' }}>{progress.current}/{progress.total}</span>
                </div>
                <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'var(--wr-border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(progress.current/progress.total)*100}%`, backgroundColor: 'var(--wr-amber)' }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {sessionAgents.map(sa => (
                <AgentAssessmentCard
                  key={sa.id}
                  sa={sa}
                  agent={getAgent(sa.agent_id)}
                  round={round}
                  onGenerate={() => generateSingleAgent(sa, round)}
                  onUpdate={(text) => updateAgentText(sa, round, text)}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'SYNTHESIS' && (
          <SynthesisPanel
            synthesis={synthesis}
            sessionId={id}
            onGenerate={generateSynthesis}
            generating={generatingSynthesis}
            synthStatus={synthStatus}
          />
        )}

        {tab === 'THREATS' && (
          <div className="space-y-6 max-w-4xl">
            {/* Existing scenario threats */}
            <div>
              <h3 className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>
                SCENARIO THREATS ({threats.length})
              </h3>
              {threats.length === 0 ? (
                <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                    No threats assigned to this scenario. Extract threats from session assessments below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {threats.map(t => (
                    <div key={t.id} className="rounded p-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--wr-text-primary)' }}>{t.name}</p>
                        <SeverityBadge severity={t.severity} />
                      </div>
                      {t.category && (
                        <p className="text-xs font-mono mb-1.5" style={{ color: 'var(--wr-amber)' }}>{t.category}</p>
                      )}
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extract new threats from session */}
            <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                    EXTRACT FROM SESSION
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>
                    Analyze agent assessments to surface new threats and save them to this scenario.
                  </p>
                </div>
                <WrButton size="sm" onClick={handleExtractThreats}
                  disabled={extracting || !sessionAgents.some(sa => sa.round1_assessment)}>
                  {extracting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...</>
                    : <><ShieldAlert className="w-3.5 h-3.5" /> Extract Threats</>}
                </WrButton>
              </div>

              {!sessionAgents.some(sa => sa.round1_assessment) && (
                <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                  Complete at least Round 1 before extracting threats.
                </p>
              )}

              {extractedThreats !== null && (
                <div>
                  {extractedThreats.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: 'var(--wr-text-muted)' }}>
                      No distinct threats could be extracted from the current assessments.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mb-3" style={{ color: 'var(--wr-text-secondary)' }}>
                        {extractedThreats.length} threat{extractedThreats.length !== 1 ? 's' : ''} found — click to select/deselect
                      </p>
                      <div className="space-y-2 mb-4">
                        {extractedThreats.map((t, i) => (
                          <div key={i}
                            className="flex items-start gap-3 rounded p-3 cursor-pointer transition-all"
                            style={{
                              backgroundColor: selectedThreats.has(i) ? 'rgba(240,165,0,0.08)' : 'var(--wr-bg-secondary)',
                              border: `1px solid ${selectedThreats.has(i) ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
                            }}
                            onClick={() => setSelectedThreats(prev => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              return next;
                            })}>
                            <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: selectedThreats.has(i) ? 'var(--wr-amber)' : 'transparent',
                                border: `1.5px solid ${selectedThreats.has(i) ? 'var(--wr-amber)' : 'var(--wr-border)'}`,
                              }}>
                              {selectedThreats.has(i) && <Check className="w-2.5 h-2.5" style={{ color: '#0D1B2A' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-xs font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{t.name}</p>
                                <SeverityBadge severity={t.severity} />
                                {t.category && (
                                  <span className="text-xs font-mono" style={{ color: 'var(--wr-amber)' }}>{t.category}</span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{t.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <WrButton size="sm" onClick={handleSaveThreats}
                          disabled={savingThreats || selectedThreats.size === 0}>
                          {savingThreats
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                            : <><Check className="w-3.5 h-3.5" /> Save {selectedThreats.size} Selected</>}
                        </WrButton>
                        <WrButton variant="secondary" size="sm" onClick={() => setExtractedThreats(null)}>
                          <X className="w-3.5 h-3.5" /> Discard
                        </WrButton>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'SETTINGS' && (
          <SessionSettingsPanel session={session} sessionAgents={sessionAgents} getAgent={getAgent} onSaved={load} />
        )}
      </div>
    </div>
  );
}