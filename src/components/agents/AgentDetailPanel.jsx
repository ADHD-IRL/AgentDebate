import { X, Edit2, Copy, Trash2 } from 'lucide-react';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { VectorBars } from '@/components/ui/VectorBar';
import WrButton from '@/components/ui/WrButton';

export default function AgentDetailPanel({ agent, domain, onEdit, onClone, onDelete, onClose }) {
  const color = domain?.color || '#F0A500';
  return (
    <div className="w-80 flex-shrink-0 border-l overflow-y-auto" style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-mono" style={{ color }}>{domain?.name || '—'}</span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--wr-text-primary)' }}>{agent.name}</h2>
            <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <SeverityBadge severity={agent.severity_default} />
          {agent.is_ai_generated && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(123,45,139,0.2)', color: '#9B59B6' }}>AI Generated</span>
          )}
        </div>

        {agent.persona_description && (
          <Section title="PERSONA">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{agent.persona_description}</p>
          </Section>
        )}

        {agent.cognitive_bias && (
          <Section title="COGNITIVE BIAS">
            <p className="text-xs leading-relaxed italic" style={{ color: 'var(--wr-text-secondary)' }}>{agent.cognitive_bias}</p>
          </Section>
        )}

        {agent.red_team_focus && (
          <Section title="RED-TEAM FOCUS">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{agent.red_team_focus}</p>
          </Section>
        )}

        <Section title="VECTOR WEIGHTS">
          <VectorBars agent={agent} />
        </Section>

        {agent.tags?.length > 0 && (
          <Section title="TAGS">
            <div className="flex flex-wrap gap-1">
              {agent.tags.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--wr-bg-card)', color: 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        <div className="flex gap-2 mt-6">
          <WrButton variant="secondary" size="sm" onClick={onEdit}><Edit2 className="w-3 h-3" /> Edit</WrButton>
          <WrButton variant="secondary" size="sm" onClick={onClone}><Copy className="w-3 h-3" /> Clone</WrButton>
          <WrButton variant="danger" size="sm" onClick={onDelete}><Trash2 className="w-3 h-3" /></WrButton>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold tracking-widest mb-2 font-mono" style={{ color: 'var(--wr-text-muted)' }}>{title}</p>
      {children}
    </div>
  );
}