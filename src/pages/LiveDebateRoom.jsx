import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { ArrowLeft, Zap, Play, Send, Loader2, Search, Globe, FlaskConical, ShieldAlert } from 'lucide-react';
import {
  generateRound1Stream, generateRound2Stream,
  generateAgentReply, generateAgentReplyWithTools,
  parseSeverityFromText,
} from '@/lib/llm';

const AGENT_COLORS = [
  '#2E86AB', '#7B2D8B', '#27AE60', '#D68910', '#C0392B',
  '#1ABC9C', '#8E44AD', '#E67E22', '#16A085', '#2980B9',
];

const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };

const STATUS = {
  idle:        { color: '#546E7A', pulse: false, label: 'Waiting' },
  thinking:    { color: '#F0A500', pulse: true,  label: 'Thinking...' },
  researching: { color: '#1ABC9C', pulse: true,  label: 'Researching...' },
  streaming:   { color: '#27AE60', pulse: true,  label: 'Speaking...' },
  done:        { color: '#27AE60', pulse: false, label: 'Done' },
};

const TOOL_ICONS = { search_knowledge: Search, fetch_url: Globe };

// ── Sub-components ────────────────────────────────────────────────────────────

function AgentCard({ agent, color, status, severity }) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <div className="p-3 rounded mb-2 transition-all duration-300"
      style={{
        backgroundColor: status === 'streaming' ? `${color}0d` : 'var(--wr-bg-secondary)',
        border: `1px solid ${status === 'streaming' ? color + '50' : 'var(--wr-border)'}`,
      }}>
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0 w-2.5 h-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.pulse && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ backgroundColor: s.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate"
            style={{ color: status === 'idle' ? 'var(--wr-text-muted)' : 'var(--wr-text-primary)' }}>
            {agent.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-mono" style={{ color: s.color }}>{s.label}</span>
        {severity && (
          <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${SEV_COLOR[severity]}15`, color: SEV_COLOR[severity] }}>
            {severity}
          </span>
        )}
      </div>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--wr-border)' }} />
      <span className="text-xs font-bold font-mono tracking-widest px-3 py-1 rounded"
        style={{ color: 'var(--wr-text-muted)', backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
        {text}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--wr-border)' }} />
    </div>
  );
}

function ToolChip({ tc }) {
  const Icon = TOOL_ICONS[tc.name] || Search;
  const label = tc.name === 'search_knowledge'
    ? tc.input.query
    : (tc.input.url || '').replace(/^https?:\/\//, '').slice(0, 50);
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mr-1 mb-1"
      style={{ backgroundColor: 'rgba(26,188,156,0.12)', color: '#1ABC9C', border: '1px solid rgba(26,188,156,0.25)' }}>
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {label}
    </span>
  );
}

function AgentBubble({ msg, color, isStreaming }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold" style={{ color }}>{msg.agentName}</span>
        {msg.discipline && (
          <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>· {msg.discipline}</span>
        )}
        {msg.severity && (
          <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded ml-auto"
            style={{ backgroundColor: `${SEV_COLOR[msg.severity]}15`, color: SEV_COLOR[msg.severity] }}>
            {msg.severity}
          </span>
        )}
      </div>
      {msg.toolCalls?.length > 0 && (
        <div className="flex flex-wrap mb-1.5">
          {msg.toolCalls.map((tc, i) => <ToolChip key={i} tc={tc} />)}
        </div>
      )}
      <div className="rounded p-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          backgroundColor: `${color}08`,
          borderLeft: `3px solid ${color}`,
          border: `1px solid ${color}20`,
          color: 'var(--wr-text-secondary)',
        }}>
        {msg.content || (isStreaming ? '' : '—')}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-1 align-middle animate-pulse rounded-sm"
            style={{ backgroundColor: color }} />
        )}
      </div>
    </div>
  );
}

function UserBubble({ msg }) {
  return (
    <div className="mb-5 flex justify-end">
      <div style={{ maxWidth: '60%' }}>
        <div className="flex items-center justify-end gap-2 mb-1.5">
          {msg.targetAgentName && (
            <span className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.2)' }}>
              → {msg.targetAgentName}
            </span>
          )}
          <span className="text-xs font-bold font-mono" style={{ color: 'var(--wr-amber)' }}>FACILITATOR</span>
        </div>
        <div className="rounded p-3 text-sm leading-relaxed"
          style={{
            backgroundColor: 'rgba(240,165,0,0.07)',
            borderRight: '3px solid var(--wr-amber)',
            border: '1px solid rgba(240,165,0,0.2)',
            color: 'var(--wr-text-primary)',
          }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveDebateRoom() {
  const { id } = useParams();
  const { db } = useWorkspace();
  const navigate = useNavigate();

  const [session, setSession]           = useState(null);
  const [scenario, setScenario]         = useState(null);
  const [sourcePins, setSourcePins]     = useState([]);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [profiles, setProfiles]         = useState({});   // agent_id → agent row
  const [colors, setColors]             = useState({});   // agent_id → hex color

  const [messages, setMessages]         = useState([]);
  const [agentStatus, setAgentStatus]   = useState({});   // agent_id → idle|thinking|streaming|done
  const [agentSeverity, setAgentSeverity] = useState({}); // agent_id → severity string

  // 'idle' | 'r1' | 'r1done' | 'r2' | 'r2done'
  const [phase, setPhase]   = useState('idle');
  const [running, setRunning] = useState(false);

  const [question, setQuestion]         = useState('');
  const [targetId, setTargetId]         = useState('all');
  const [asking, setAsking]             = useState(false);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [threats, setThreats]           = useState([]);

  const transcriptRef  = useRef(null);
  const streamBuf      = useRef({});  // tempId → accumulated text

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const [sess, saList, msgs] = await Promise.all([
        db.Session.get(id),
        db.SessionAgent.filter({ session_id: id }),
        db.SessionMessage.filter({ session_id: id }),
      ]);
      setSession(sess);
      setSourcePins(sess?.source_pins || []);
      setSessionAgents(saList);

      const p = {}, c = {}, statuses = {}, severities = {};
      for (let i = 0; i < saList.length; i++) {
        const sa = saList[i];
        const agent = await db.Agent.get(sa.agent_id);
        if (agent) {
          p[sa.agent_id] = agent;
          c[sa.agent_id] = AGENT_COLORS[i % AGENT_COLORS.length];
        }
        statuses[sa.agent_id]  = sa.round1_assessment ? 'done' : 'idle';
        if (sa.round2_revised_severity || sa.round1_severity)
          severities[sa.agent_id] = sa.round2_revised_severity || sa.round1_severity;
      }
      setProfiles(p);
      setColors(c);
      setAgentStatus(statuses);
      setAgentSeverity(severities);

      const hasR1 = saList.some(sa => sa.round1_assessment);
      const hasR2 = saList.some(sa => sa.round2_rebuttal);
      setPhase(hasR2 ? 'r2done' : hasR1 ? 'r1done' : 'idle');

      if (sess?.scenario_id) {
        setScenario(await db.Scenario.get(sess.scenario_id));
        const t = await db.Threat.filter({ scenario_id: sess.scenario_id });
        setThreats(t);
      }

      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        agentId: m.agent_id,
        agentName: m.metadata?.agentName,
        discipline: m.metadata?.discipline,
        severity: m.metadata?.severity,
        targetAgentName: m.metadata?.targetAgentName,
      })));
    })();
  }, [db, id]);

  // Auto-scroll
  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const push = useCallback(msg =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]), []);

  const appendToken = useCallback((tempId, token) => {
    streamBuf.current[tempId] = (streamBuf.current[tempId] || '') + token;
    const text = streamBuf.current[tempId];
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: text } : m));
  }, []);

  const finishStream = useCallback((tempId, finalText, extra = {}) => {
    setMessages(prev => prev.map(m =>
      m.id === tempId ? { ...m, content: finalText, isStreaming: false, ...extra } : m
    ));
    delete streamBuf.current[tempId];
  }, []);

  const scenarioCtx = scenario?.context_document || session?.context_override || '';

  // ── Round 1 ───────────────────────────────────────────────────────────────

  const startRound1 = async () => {
    if (running) return;
    setRunning(true);
    setPhase('r1');

    const sysMsg = { role: 'system', content: 'ROUND 1 — INDEPENDENT ASSESSMENTS' };
    push(sysMsg);
    await db.SessionMessage.create({ session_id: id, ...sysMsg, round: 1, metadata: {} });

    for (const sa of sessionAgents) {
      const agent = profiles[sa.agent_id];
      if (!agent || sa.round1_assessment) continue;

      setAgentStatus(s => ({ ...s, [sa.agent_id]: 'thinking' }));
      const tempId = `r1_${sa.agent_id}`;
      streamBuf.current[tempId] = '';
      push({ id: tempId, role: 'agent', agentId: sa.agent_id, agentName: agent.name, discipline: agent.discipline, content: '', round: 1, isStreaming: true });

      try {
        await generateRound1Stream({
          agent, scenarioContext: scenarioCtx, phaseFocus: session?.phase_focus,
          threatCatalog: threats,
          onToken: token => {
            setAgentStatus(s => ({ ...s, [sa.agent_id]: 'streaming' }));
            appendToken(tempId, token);
          },
          onDone: async text => {
            const { assessment, severity } = parseSeverityFromText(text, agent.severity_default || 'HIGH');
            finishStream(tempId, assessment, { severity });
            setAgentStatus(s => ({ ...s, [sa.agent_id]: 'done' }));
            setAgentSeverity(s => ({ ...s, [sa.agent_id]: severity }));
            await db.SessionAgent.update(sa.id, { round1_assessment: assessment, round1_severity: severity, status: 'round1' });
            await db.SessionMessage.create({ session_id: id, agent_id: sa.agent_id, role: 'agent', content: assessment, round: 1, metadata: { agentName: agent.name, discipline: agent.discipline, severity } });
          },
        });
      } catch (err) {
        setAgentStatus(s => ({ ...s, [sa.agent_id]: 'idle' }));
        setMessages(prev => prev.filter(m => m.id !== tempId));
        push({ role: 'system', content: `Error (${agent.name}): ${err.message}` });
      }
    }

    await db.Session.update(id, { status: 'round1' });
    setPhase('r1done');
    setRunning(false);
    const done = { role: 'system', content: 'ROUND 1 COMPLETE — you can now ask questions or start Round 2' };
    push(done);
    await db.SessionMessage.create({ session_id: id, ...done, round: 1, metadata: {} });
  };

  // ── Round 2 ───────────────────────────────────────────────────────────────

  const startRound2 = async () => {
    if (running) return;
    setRunning(true);
    setPhase('r2');
    setAgentStatus(s => Object.fromEntries(Object.keys(s).map(k => [k, 'idle'])));

    const sysMsg = { role: 'system', content: 'ROUND 2 — CROSS-AGENT REBUTTALS' };
    push(sysMsg);
    await db.SessionMessage.create({ session_id: id, ...sysMsg, round: 2, metadata: {} });

    const othersCtx = (currentId) => sessionAgents
      .filter(sa => sa.agent_id !== currentId && sa.round1_assessment)
      .map(sa => `=== ${profiles[sa.agent_id]?.name} ===\n${sa.round1_assessment}`)
      .join('\n\n---\n\n');

    for (const sa of sessionAgents) {
      const agent = profiles[sa.agent_id];
      if (!agent || sa.round2_rebuttal) continue;

      setAgentStatus(s => ({ ...s, [sa.agent_id]: 'thinking' }));
      const tempId = `r2_${sa.agent_id}`;
      streamBuf.current[tempId] = '';
      push({ id: tempId, role: 'agent', agentId: sa.agent_id, agentName: agent.name, discipline: agent.discipline, content: '', round: 2, isStreaming: true });

      try {
        await generateRound2Stream({
          agent, scenarioContext: scenarioCtx, phaseFocus: session?.phase_focus,
          othersAssessments: othersCtx(sa.agent_id),
          threatCatalog: threats,
          onToken: token => {
            setAgentStatus(s => ({ ...s, [sa.agent_id]: 'streaming' }));
            appendToken(tempId, token);
          },
          onDone: async text => {
            const { assessment, severity } = parseSeverityFromText(text, sa.round1_severity || 'HIGH');
            finishStream(tempId, assessment, { severity });
            setAgentStatus(s => ({ ...s, [sa.agent_id]: 'done' }));
            setAgentSeverity(s => ({ ...s, [sa.agent_id]: severity }));
            await db.SessionAgent.update(sa.id, { round2_rebuttal: assessment, round2_revised_severity: severity, status: 'round2' });
            await db.SessionMessage.create({ session_id: id, agent_id: sa.agent_id, role: 'agent', content: assessment, round: 2, metadata: { agentName: agent.name, discipline: agent.discipline, severity } });
          },
        });
      } catch (err) {
        setAgentStatus(s => ({ ...s, [sa.agent_id]: 'idle' }));
        setMessages(prev => prev.filter(m => m.id !== tempId));
        push({ role: 'system', content: `Error (${agent.name}): ${err.message}` });
      }
    }

    await db.Session.update(id, { status: 'round2' });
    setPhase('r2done');
    setRunning(false);
    const done = { role: 'system', content: 'ROUND 2 COMPLETE — ready to synthesize' };
    push(done);
    await db.SessionMessage.create({ session_id: id, ...done, round: 2, metadata: {} });
  };

  // ── Facilitator question ──────────────────────────────────────────────────

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    const q = question.trim();
    setQuestion('');

    const targetAgent = targetId === 'all' ? null : profiles[targetId];
    push({ role: 'user', content: q, targetAgentName: targetAgent?.name || null });
    await db.SessionMessage.create({ session_id: id, role: 'user', content: q, metadata: { targetAgentName: targetAgent?.name || null } });

    const targets = targetId === 'all' ? sessionAgents : sessionAgents.filter(sa => sa.agent_id === targetId);
    const priorCtx = messages.filter(m => m.role !== 'system').slice(-8)
      .map(m => ({ agentName: m.agentName || null, content: m.content }));

    for (const sa of targets) {
      const agent = profiles[sa.agent_id];
      if (!agent) continue;
      setAgentStatus(s => ({ ...s, [sa.agent_id]: 'thinking' }));
      const tempId = `q_${sa.agent_id}_${Date.now()}`;
      streamBuf.current[tempId] = '';
      push({ id: tempId, role: 'agent', agentId: sa.agent_id, agentName: agent.name, discipline: agent.discipline, content: '', isStreaming: true });
      try {
        if (toolsEnabled) {
          await generateAgentReplyWithTools({
            agent, question: q, priorMessages: priorCtx, scenarioContext: scenarioCtx, sourcePins,
            onToolCall: (tc) => {
              setAgentStatus(s => ({ ...s, [sa.agent_id]: 'researching' }));
              setMessages(prev => prev.map(m =>
                m.id === tempId
                  ? { ...m, toolCalls: [...(m.toolCalls || []), tc] }
                  : m
              ));
            },
            onDone: async (text, toolCalls) => {
              setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: text, isStreaming: false, toolCalls } : m
              ));
              setAgentStatus(s => ({ ...s, [sa.agent_id]: phase.endsWith('done') ? 'done' : 'idle' }));
              await db.SessionMessage.create({ session_id: id, agent_id: sa.agent_id, role: 'agent', content: text, metadata: { agentName: agent.name, discipline: agent.discipline, toolCalls } });
            },
          });
        } else {
          await generateAgentReply({
            agent, question: q, priorMessages: priorCtx, scenarioContext: scenarioCtx,
            onToken: token => { setAgentStatus(s => ({ ...s, [sa.agent_id]: 'streaming' })); appendToken(tempId, token); },
            onDone: async text => {
              finishStream(tempId, text);
              setAgentStatus(s => ({ ...s, [sa.agent_id]: phase.endsWith('done') ? 'done' : 'idle' }));
              await db.SessionMessage.create({ session_id: id, agent_id: sa.agent_id, role: 'agent', content: text, metadata: { agentName: agent.name, discipline: agent.discipline } });
            },
          });
        }
      } catch {
        setAgentStatus(s => ({ ...s, [sa.agent_id]: 'idle' }));
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
    setAsking(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  const canR1    = phase === 'idle'   && !running;
  const canR2    = phase === 'r1done' && !running;
  const canSynth = phase === 'r2done' && !running;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 flex-shrink-0"
        style={{ backgroundColor: 'var(--wr-bg-card)', borderBottom: '1px solid var(--wr-border)' }}>
        <button onClick={() => navigate(`/sessions/${id}`)}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: 'var(--wr-text-muted)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wr-amber)' }} />
          <p className="text-sm font-bold font-mono truncate" style={{ color: 'var(--wr-text-primary)' }}>
            {session.name}
          </p>
          {scenario && (
            <span className="text-xs truncate hidden sm:block" style={{ color: 'var(--wr-text-muted)' }}>
              · {scenario.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setToolsEnabled(v => !v)}
            title={toolsEnabled ? 'Tool use enabled — agents can search for information' : 'Tool use disabled'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all"
            style={{
              backgroundColor: toolsEnabled ? 'rgba(26,188,156,0.12)' : 'transparent',
              border: `1px solid ${toolsEnabled ? '#1ABC9C' : 'var(--wr-border)'}`,
              color: toolsEnabled ? '#1ABC9C' : 'var(--wr-text-muted)',
            }}>
            <FlaskConical className="w-3 h-3" /> TOOLS {toolsEnabled ? 'ON' : 'OFF'}
          </button>
          {[
            { label: 'ROUND 1', can: canR1, action: startRound1, color: '#2E86AB' },
            { label: 'ROUND 2', can: canR2, action: startRound2, color: '#D68910' },
          ].map(({ label, can, action, color }) => (
            <button key={label} onClick={action} disabled={!can}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: can ? `${color}18` : 'transparent', border: `1px solid ${can ? color : 'var(--wr-border)'}`, color: can ? color : 'var(--wr-text-muted)' }}>
              <Play className="w-3 h-3" /> {label}
            </button>
          ))}
          <button
            disabled={!canSynth}
            onClick={() => navigate(`/sessions/${id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: canSynth ? 'rgba(240,165,0,0.15)' : 'transparent', border: `1px solid ${canSynth ? 'var(--wr-amber)' : 'var(--wr-border)'}`, color: canSynth ? 'var(--wr-amber)' : 'var(--wr-text-muted)' }}>
            <Zap className="w-3 h-3" /> SYNTHESIZE
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Agent panel */}
        <div className="w-52 flex-shrink-0 p-3 overflow-y-auto"
          style={{ backgroundColor: 'var(--wr-bg-secondary)', borderRight: '1px solid var(--wr-border)' }}>
          <p className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>
            AGENTS
          </p>
          {sessionAgents.map(sa => {
            const agent = profiles[sa.agent_id];
            if (!agent) return null;
            return (
              <AgentCard key={sa.agent_id} agent={agent}
                color={colors[sa.agent_id] || '#546E7A'}
                status={agentStatus[sa.agent_id] || 'idle'}
                severity={agentSeverity[sa.agent_id]} />
            );
          })}
          {sourcePins.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wr-border)' }}>
              <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>
                SOURCES ({sourcePins.length})
              </p>
              {sourcePins.map((pin, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1.5">
                  <Globe className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#1ABC9C' }} />
                  <div className="min-w-0">
                    {pin.label && (
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--wr-text-secondary)' }}>{pin.label}</p>
                    )}
                    <a href={pin.url} target="_blank" rel="noreferrer"
                      className="text-xs truncate block hover:underline"
                      style={{ color: 'var(--wr-text-muted)' }}>
                      {pin.url.replace(/^https?:\/\//, '').slice(0, 28)}…
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wr-border)' }}>
            <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>STATUS</p>
            {running ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#27AE60' }} />
                <span className="text-xs font-mono" style={{ color: '#27AE60' }}>
                  {phase === 'r1' ? 'Round 1...' : phase === 'r2' ? 'Round 2...' : 'Running...'}
                </span>
              </div>
            ) : (
              <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                {phase === 'idle' ? 'Awaiting start' : phase === 'r1done' ? 'R1 complete' : phase === 'r2done' ? 'R2 complete' : '—'}
              </span>
            )}
          </div>

          {threats.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--wr-border)' }}>
              <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>
                THREATS ({threats.length})
              </p>
              {threats.map(t => (
                <div key={t.id} className="mb-2 rounded p-2"
                  style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--wr-text-primary)' }}>
                      {t.name}
                    </p>
                    <span className="text-xs font-bold font-mono flex-shrink-0"
                      style={{ color: SEV_COLOR[t.severity] || 'var(--wr-text-muted)' }}>
                      {t.severity?.[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => setQuestion(`Regarding the threat "${t.name}": ${t.description || ''} What are the implications for this scenario?`)}
                    className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 mt-1"
                    style={{ color: 'var(--wr-amber)' }}>
                    <ShieldAlert className="w-2.5 h-2.5" /> Surface
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transcript + input */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Zap className="w-10 h-10 mb-4 opacity-20" style={{ color: 'var(--wr-amber)' }} />
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--wr-text-secondary)' }}>Debate room ready</p>
                <p className="text-xs max-w-xs" style={{ color: 'var(--wr-text-muted)' }}>
                  Click <strong>ROUND 1</strong> to begin. Agents will stream their assessments live.
                </p>
              </div>
            )}
            {messages.map(msg => {
              if (msg.role === 'system') return <Divider key={msg.id} text={msg.content} />;
              if (msg.role === 'user')   return <UserBubble key={msg.id} msg={msg} />;
              return (
                <AgentBubble key={msg.id} msg={msg}
                  color={colors[msg.agentId] || '#546E7A'}
                  isStreaming={msg.isStreaming} />
              );
            })}
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 p-4" style={{ backgroundColor: 'var(--wr-bg-card)', borderTop: '1px solid var(--wr-border)' }}>
            <div className="flex items-center gap-3">
              <select value={targetId} onChange={e => setTargetId(e.target.value)}
                className="text-xs rounded px-2 py-2 outline-none flex-shrink-0"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', minWidth: 130 }}>
                <option value="all">All Agents</option>
                {sessionAgents.map(sa => {
                  const a = profiles[sa.agent_id];
                  return a ? <option key={sa.agent_id} value={sa.agent_id}>{a.name}</option> : null;
                })}
              </select>
              <input value={question} onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
                placeholder="Ask a question or direct the debate..."
                className="flex-1 px-3 py-2 text-sm rounded outline-none"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
              <button onClick={handleAsk} disabled={asking || !question.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Ask
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--wr-text-muted)' }}>
              Direct to one agent or broadcast to all · Enter to send · {toolsEnabled ? 'Paste a URL in your question to send agents to a specific source' : 'Tool use off — direct replies only'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

