import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Settings2, Brain, CheckCircle2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import WrButton from '@/components/ui/WrButton';


const MODELS = [
  {
    value: 'claude_sonnet_4_6',
    label: 'Claude Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed. Recommended for most use cases.',
    badge: 'DEFAULT',
    badgeColor: '#27AE60',
  },
  {
    value: 'claude_opus_4_6',
    label: 'Claude Opus',
    provider: 'Anthropic',
    description: 'Most powerful Anthropic model. Best for deep, complex analysis. Uses more credits.',
    badge: 'PREMIUM',
    badgeColor: '#D68910',
  },
  {
    value: 'claude_haiku',
    label: 'Claude Haiku',
    provider: 'Anthropic',
    description: 'Fastest and most economical. Good for quick iterations and high-volume tasks.',
    badge: 'FAST',
    badgeColor: '#2E86AB',
  },
];

export default function Settings() {
  const { db } = useWorkspace();
  const [currentModel, setCurrentModel] = useState('claude_sonnet_4_6');
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    db.AppConfig.filter({ key: 'llm_model' }).then((configs) => {
      if (configs[0]) {
        setCurrentModel(configs[0].value);
        setConfigId(configs[0].id);
      }
      setLoading(false);
    });
  }, [db]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const selectedModel = MODELS.find(m => m.value === currentModel);
    const payload = {
      key: 'llm_model',
      value: currentModel,
      label: selectedModel?.label || currentModel,
    };

    if (configId) {
      await db.AppConfig.update(configId, payload);
    } else {
      const created = await db.AppConfig.create(payload);
      setConfigId(created.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Settings2}
        title="SETTINGS"
        subtitle="Platform configuration and preferences"
      />

      <div className="p-6 max-w-2xl space-y-6">
        {/* LLM Provider */}
        <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
            <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
              AI MODEL SELECTION
            </h2>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--wr-text-muted)' }}>
            Choose the LLM used for all AI-enabled features: agent generation, assessments, synthesis, chain building, and scenario enhancement.
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-secondary)' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {MODELS.map((model) => {
                const isSelected = currentModel === model.value;
                return (
                  <button
                    key={model.value}
                    onClick={() => setCurrentModel(model.value)}
                    className="w-full text-left rounded p-4 transition-all"
                    style={{
                      backgroundColor: isSelected ? 'rgba(240,165,0,0.06)' : 'var(--wr-bg-secondary)',
                      border: isSelected ? '1px solid rgba(240,165,0,0.4)' : '1px solid var(--wr-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: isSelected ? 'var(--wr-amber)' : 'var(--wr-border)' }}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--wr-amber)' }} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>
                              {model.label}
                            </span>
                            <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                              by {model.provider}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>
                            {model.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: `${model.badgeColor}22`, color: model.badgeColor }}>
                        {model.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <WrButton onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                'Save Preference'
              )}
            </WrButton>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#27AE60' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved — all AI features will now use {MODELS.find(m => m.value === currentModel)?.label}
              </div>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
          <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>NOTE</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-muted)' }}>
            All AI models use your configured Anthropic API key. Higher capability models may take longer to respond and consume more API credits. This setting applies to all members of your workspace.
          </p>
        </div>


      </div>


    </div>
  );
}