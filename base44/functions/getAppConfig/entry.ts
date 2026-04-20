import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Mapping from our config value to Anthropic model identifiers
const ANTHROPIC_MODEL_MAP = {
  'claude_sonnet_4_6': 'claude-sonnet-4-5',
  'claude_opus_4_6': 'claude-opus-4-5',
  'claude_haiku': 'claude-3-haiku-20240307',
};

// Default model if none configured
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_CONFIG_VALUE = 'claude_sonnet_4_6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id } = await req.json().catch(() => ({}));
    const filter = workspace_id ? { key: 'llm_model', workspace_id } : { key: 'llm_model' };
    const configs = await base44.asServiceRole.entities.AppConfig.filter(filter);
    const config = configs[0];

    const configValue = config?.value || DEFAULT_CONFIG_VALUE;
    const anthropicModel = ANTHROPIC_MODEL_MAP[configValue] || DEFAULT_MODEL;

    return Response.json({
      llm_model: configValue,
      anthropic_model: anthropicModel,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});