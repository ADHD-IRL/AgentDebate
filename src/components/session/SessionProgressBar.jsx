import { CheckCircle2, Circle, AlertCircle, Link2, ShieldAlert, BookOpen } from 'lucide-react';

const SEV_COLOR = {
  CRITICAL: '#C0392B',
  HIGH: '#D68910',
  MEDIUM: '#2E86AB',
  LOW: '#27AE60',
};

function AgentDot({ agent, done, active, generating }) {
  const color = agent?.domain_color || '#546E7A';
  return (
    <span
      title={`${agent?.name || '?'} — ${done ? 'complete' : generating ? 'generating' : 'pending'}`}
      className="flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all"
      style={{
        backgroundColor: done ? '#27AE60' : generating ? '#D68910' : 'var(--wr-border)',
        boxShadow: generating ? '0 0 0 2px rgba(214,137,16,0.3)' : done ? 'none' : 'none',
        outline: done ? 'none' : `1.5px solid ${color}44`,
      }}
    />
  );
}

function StatChip({ icon: Icon, label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-colors"
      style={{
        backgroundColor: count > 0 ? `${color}18` : 'transparent',
        color: count > 0 ? color : 'var(--wr-text-muted)',
        border: `1px solid ${count > 0 ? color + '44' : 'var(--wr-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {count !== null && (
        <span className="font-bold">{count}</span>
      )}
    </button>
  );
}

function RoundProgress({ label, sessionAgents, fieldKey, generating, onTabClick }) {
  const total = sessionAgents.length;
  const done = sessionAgents.filter(sa => sa[fieldKey]).length;
  const allDone = done === total && total > 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <button
      onClick={onTabClick}
      className="flex items-center gap-2 group"
      style={{ cursor: 'pointer' }}
    >
      <span
        className="text-xs font-mono font-bold tracking-wider"
        style={{ color: allDone ? '#27AE60' : 'var(--wr-text-muted)', minWidth: 56 }}
      >
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        {sessionAgents.map((sa) => (
          <AgentDot
            key={sa.id}
            agent={sa._agent}
            done={!!sa[fieldKey]}
            generating={generating && !sa[fieldKey]}
          />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: allDone ? '#27AE60' : 'var(--wr-text-muted)' }}>
        {done}/{total}
      </span>
      {allDone && <CheckCircle2 className="w-3 h-3" style={{ color: '#27AE60' }} />}
    </button>
  );
}

export default function SessionProgressBar({
  sessionAgents,
  agents,
  synthesis,
  threats,
  sessionSources,
  generatingAll,
  generatingSynthesis,
  onTabChange,
}) {
  const enriched = sessionAgents.map(sa => ({
    ...sa,
    _agent: agents.find(a => a.id === sa.agent_id),
  }));

  const rawChains = synthesis?.compound_chains;
  const chainCount = Array.isArray(rawChains) ? rawChains.length
    : typeof rawChains === 'string' ? (() => { try { const p = JSON.parse(rawChains); return Array.isArray(p) ? p.length : 0; } catch { return 0; } })()
    : 0;
  const r1Done = enriched.filter(sa => sa.round1_assessment).length;
  const r2Done = enriched.filter(sa => sa.round2_rebuttal).length;
  const synthDone = !!synthesis?.raw_text;

  const sevCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const t of threats) {
    const sev = (t.severity || '').toUpperCase();
    if (sev in sevCounts) sevCounts[sev]++;
  }

  return (
    <div
      className="flex items-center gap-4 px-6 py-2 border-b overflow-x-auto"
      style={{
        borderColor: 'var(--wr-border)',
        backgroundColor: 'var(--wr-bg-secondary)',
        minHeight: 40,
      }}
    >
      {/* R1 */}
      <RoundProgress
        label="R1"
        sessionAgents={enriched}
        fieldKey="round1_assessment"
        generating={generatingAll}
        onTabClick={() => onTabChange('ROUND 1')}
      />

      <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />

      {/* R2 */}
      <RoundProgress
        label="R2"
        sessionAgents={enriched}
        fieldKey="round2_rebuttal"
        generating={generatingAll}
        onTabClick={() => onTabChange('ROUND 2')}
      />

      <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />

      {/* Synthesis */}
      <button
        onClick={() => onTabChange('SYNTHESIS')}
        className="flex items-center gap-1.5 text-xs font-mono transition-colors"
        style={{ color: synthDone ? '#27AE60' : generatingSynthesis ? '#D68910' : 'var(--wr-text-muted)' }}
      >
        {synthDone ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : generatingSynthesis ? (
          <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#D68910', display: 'inline-block' }} />
        ) : (
          <Circle className="w-3 h-3" />
        )}
        SYNTHESIS
      </button>

      <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />

      {/* Chains */}
      <StatChip
        icon={Link2}
        label="CHAINS"
        count={chainCount}
        color="#2E86AB"
        onClick={() => onTabChange('SYNTHESIS')}
      />

      {/* Threats */}
      <StatChip
        icon={ShieldAlert}
        label="THREATS"
        count={threats.length}
        color={sevCounts.CRITICAL > 0 ? '#C0392B' : sevCounts.HIGH > 0 ? '#D68910' : '#2E86AB'}
        onClick={() => onTabChange('THREATS')}
      />

      {/* Sources */}
      <StatChip
        icon={BookOpen}
        label="SOURCES"
        count={sessionSources.length}
        color="#9B59B6"
        onClick={() => onTabChange('SOURCES')}
      />

      {/* Critical threat callout */}
      {sevCounts.CRITICAL > 0 && (
        <>
          <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: 'var(--wr-border)' }} />
          <div className="flex items-center gap-1 text-xs font-mono font-bold" style={{ color: '#C0392B' }}>
            <AlertCircle className="w-3 h-3" />
            {sevCounts.CRITICAL} CRITICAL
          </div>
        </>
      )}
    </div>
  );
}
