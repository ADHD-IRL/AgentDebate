import AgentAvatar from './AgentAvatar';
import Waveform from './Waveform';

export default function SpeakerStage({
  agents = [],          // array of { id, name, discipline, color, hue, voiceId }
  colors = {},          // agent_id → hex color
  agentStatus = {},     // agent_id → 'idle'|'thinking'|'researching'|'streaming'|'done'
  currentSpeakerId,     // agent currently playing TTS audio
  speakerText,          // last spoken text snippet for caption
  targetAgentId,        // currently targeted agent (for 'active' highlight)
  phase,
  running,
  onAgentClick,
}) {
  const speakingAgent = agents.find(a => a.id === currentSpeakerId);

  function avatarStatus(agent) {
    if (agent.id === currentSpeakerId) return 'speaking';
    const s = agentStatus[agent.id];
    if (s === 'thinking' || s === 'researching') return 'thinking';
    if (s === 'streaming') return 'speaking';
    return 'idle';
  }

  const phaseLabel = running
    ? (phase === 'r1' ? 'ROUND 1 · RUNNING' : phase === 'r2' ? 'ROUND 2 · RUNNING' : 'RUNNING')
    : (phase === 'r1done' ? 'ROUND 1 · COMPLETE' : phase === 'r2done' ? 'ROUND 2 · COMPLETE' : 'LIVE');

  return (
    <div style={{
      backgroundColor: 'var(--wr-bg-card)',
      borderBottom: '1px solid var(--wr-border)',
      flexShrink: 0,
    }}>
      {/* Header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--wr-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#C0392B', display: 'inline-block' }} />
          <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: '#C0392B' }}>
            {phaseLabel}
          </span>
        </div>
        <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>
          {agents.length} analyst{agents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Avatar row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '12px 16px' }}>
        {agents.map(agent => (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            color={colors[agent.id]}
            size={56}
            status={avatarStatus(agent)}
            active={targetAgentId === agent.id}
            showLabel
            onClick={() => onAgentClick?.(agent.id)}
          />
        ))}
      </div>

      {/* Speaker caption */}
      {speakingAgent && speakerText && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '0 16px 10px', padding: '6px 10px', borderRadius: 5,
          backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)',
        }}>
          <Waveform color={colors[speakingAgent.id] || speakingAgent.color} barCount={28} height={18} isActive />
          <p style={{ fontSize: 11.5, fontStyle: 'italic', flex: 1, color: 'var(--wr-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{speakerText}"
          </p>
        </div>
      )}
    </div>
  );
}
