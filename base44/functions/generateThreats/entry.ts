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

    const { scenarioContext, scenarioName, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    const prompt = `You are a strategic threat analyst for the WARROOM intelligence platform.

Based on this scenario: "${scenarioName}"

Context:
${scenarioContext}

Generate 7 specific, operationally relevant threats. Return a JSON object:
{
  "threats": [
    {
      "name": "concise threat name",
      "description": "2-3 sentence description of the threat mechanism and why it matters",
      "severity": "CRITICAL or HIGH or MEDIUM or LOW",
      "category": "category label (e.g. Supply Chain, Cyber, HUMINT, Physical, IO)"
    }
  ]
}

Make threats specific to this scenario, not generic. Include threats across multiple disciplines. Return ONLY the JSON.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) return Response.json({ error: data.error?.message || 'API error', details: data }, { status: 500 });
    const text = data.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});