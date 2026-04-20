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

    const { scenarioContext, agentList, chain_type, num_steps, focus_area, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    const agentListText = agentList.map(a => `- ${a.name} (${a.discipline})`).join('\n');

    const prompt = `You are generating a compound scenario chain for the WARROOM strategic analysis system.

A chain is a multi-step sequence showing how a scenario, threat, or adversary operation unfolds across multiple disciplines. Each step is attributed to one or more expert disciplines.

Scenario Context:
${scenarioContext || '(no specific scenario provided)'}

Available Agent Disciplines:
${agentListText}

Chain Type: ${chain_type}
Focus Area: ${focus_area || 'general'}
Number of Steps: ${num_steps}

Generate a compound chain with ${num_steps} steps. Return a JSON object:
{
  "name": "Evocative chain name in quotes — e.g. 'The Long Game' or 'Price Cascade'",
  "description": "2-3 sentence summary of what this chain represents",
  "steps": [
    {
      "step_number": 1,
      "agent_label": "Agent name or discipline label from the list above",
      "step_text": "Clear description of what happens in this step and why it matters"
    }
  ]
}

Make the chain operationally coherent — each step should flow logically from the previous. The chain should represent something that no single discipline would identify alone. Return ONLY the JSON.`;

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