import { ArrowDown } from 'lucide-react';

export default function ChainTimeline({ chain, agents = [] }) {
  const steps = chain?.steps || [];
  if (steps.length === 0) return null;

  const getAgentLabel = (step) => {
    if (step.agent_id) {
      const agent = agents.find(a => a.id === step.agent_id);
      if (agent) return { name: agent.name, discipline: agent.discipline };
    }
    return { name: step.agent_label || '—', discipline: null };
  };

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const { name, discipline } = getAgentLabel(step);
        return (
          <div key={i}>
            <div className="flex gap-4 items-start">
              {/* Step number bubble + vertical line */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono z-10 flex-shrink-0"
                  style={{ backgroundColor: 'rgba(240,165,0,0.15)', border: '2px solid var(--wr-amber)', color: 'var(--wr-amber)' }}
                >
                  {step.step_number}
                </div>
              </div>

              {/* Step content card */}
              <div className="flex-1 pb-2 rounded-lg p-4 mb-1"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--wr-amber)' }}>
                      {name}
                    </span>
                    {discipline && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                        {discipline}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
                    STEP {step.step_number}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>
                  {step.step_text}
                </p>
              </div>
            </div>

            {/* Connector arrow */}
            {i < steps.length - 1 && (
              <div className="flex items-center gap-4 py-1">
                <div className="flex-shrink-0 flex justify-center" style={{ width: 32 }}>
                  <ArrowDown className="w-4 h-4" style={{ color: 'var(--wr-amber)', opacity: 0.5 }} />
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--wr-border)' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}