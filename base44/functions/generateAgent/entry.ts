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

    const { domain_id, expert_type, prior_background, key_focus, bias_toward, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    const prompt = `You are building an expert agent profile for the WARROOM strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${expert_type}
Prior background hints: ${prior_background || 'none'}
Key focus area: ${key_focus || 'none'}
Known bias toward: ${bias_toward || 'none'}

Return a JSON object with exactly these fields:
{
  "name": "short descriptive name (e.g. 'Maritime & Naval Expert')",
  "discipline": "2-4 word discipline label",
  "persona_description": "3-4 sentence description of who this expert is, how they think, what they have seen in their career, what they prioritize above all else",
  "cognitive_bias": "1-2 sentences describing what this expert systematically underweights or misses due to their discipline focus",
  "red_team_focus": "2-3 sentences on what specifically this agent hunts for when analyzing any scenario or threat",
  "severity_default": "CRITICAL or HIGH or MEDIUM",
  "vector_human": 50,
  "vector_technical": 50,
  "vector_physical": 30,
  "vector_futures": 40,
  "tags": ["array", "of", "3-5", "relevant", "tags"]
}

Return ONLY the JSON object. No preamble, no explanation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return Response.json({ error: data.error?.message || 'Anthropic API error', details: data }, { status: 500 });
    }
    const text = data.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const agentData = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return Response.json(agentData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});