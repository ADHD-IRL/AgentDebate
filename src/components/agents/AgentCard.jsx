import SeverityBadge from '@/components/ui/SeverityBadge';
import { VectorBars } from '@/components/ui/VectorBar';
import { Edit2, Copy } from 'lucide-react';

export default function AgentCard({ agent, domain, selected, onClick, onEdit, onClone }) {
  const color = domain?.color || '#F0A500';
  return (
    <div
      onClick={onClick}
      className="rounded overflow-hidden cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: 'var(--wr-bg-card)',
        border: `1px solid ${selected ? color : 'var(--wr-border)'}`,
        boxShadow: selected ? `0 0 0 1px ${color}44` : 'none',
      }}
    >
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--wr-text-primary)' }}>{agent.name}</h3>
            <p className="text-xs truncate" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
          </div>
          <SeverityBadge severity={agent.severity_default} size="xs" />
        </div>

        <div className="mt-3">
          <VectorBars agent={agent} />
        </div>

        {agent.cognitive_bias && (
          <p className="text-xs mt-3 italic line-clamp-2" style={{ color: 'var(--wr-text-muted)' }}>
            "{agent.cognitive_bias}"
          </p>
        )}

        {agent.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {agent.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-muted)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--wr-text-muted)' }}
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClone(); }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--wr-text-muted)' }}
          >
            <Copy className="w-3 h-3" /> Clone
          </button>
          {agent.is_ai_generated && (
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(123,45,139,0.2)', color: '#9B59B6' }}>
              AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
}