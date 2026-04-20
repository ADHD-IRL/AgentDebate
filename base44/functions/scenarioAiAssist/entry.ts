import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const ANTHROPIC_MODEL_MAP = {
  'claude_sonnet_4_6': 'claude-sonnet-4-5',
  'claude_opus_4_6': 'claude-opus-4-5',
  'claude_haiku': 'claude-3-haiku-20240307',
};
const DEFAULT_MODEL = 'claude-sonnet-4-5';

async function getModel(base44, workspace_id) {
  const filter = workspace_id ? { key: 'llm_model', workspace_id } : { key: 'llm_model' };
  const configs = await base44.asServiceRole.entities.AppConfig.filter(filter);
  const val = configs[0]?.value;
  return ANTHROPIC_MODEL_MAP[val] || DEFAULT_MODEL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { context, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    const prompt = `You are a strategic intelligence analyst. The user has written a scenario context document for a red team analysis session.

Improve and expand the following scenario context document. Make it:
- More specific and operationally detailed
- Include relevant geopolitical/technical/economic context
- Add timeline context if relevant
- Identify key actors, systems, and dependencies
- Make it detailed enough for expert analysts to do substantive assessment

Original context:
${context}

Return only the improved context document text. No preamble or explanation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) return Response.json({ error: data.error?.message || 'API error', details: data }, { status: 500 });
    const improved = data.content[0].text.trim();

    return Response.json({ improved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});