import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a senior red team analyst specializing in adversarial chain analysis and defensive countermeasure development. Your job is to dissect multi-step attack chains and identify exactly where defenders should intervene to prevent adversary success.

You will receive a JSON input with two fields:
- chain: an object with name, description, and steps (array of { step_number, agent_label, step_text })
- scenarioContext: optional free-text scenario context describing the threat environment, target, or geopolitical setting

Analyze the chain from the adversary's perspective first — understand what they are trying to achieve and what each step contributes to that goal. Then shift to the defender's perspective and identify where the chain can be broken most efficiently.

For each step assess:

ADVERSARY OBJECTIVE: What specific capability, access, information, or condition does the adversary gain by completing this step? Be concrete and specific to the step text, not generic.

DEPENDENCIES: What preconditions must hold for this step to succeed? Include technical, human, logistical, or timing requirements. These are the assumptions the adversary is relying on — if any fail, the step fails.

LEVERAGE: Rate HIGH, MEDIUM, or LOW based on how much breaking this step degrades the rest of the chain.
- HIGH: This step is a critical dependency for multiple downstream steps, or its failure causes chain collapse.
- MEDIUM: Breaking this step degrades the chain significantly but the adversary has plausible alternate paths.
- LOW: The adversary can bypass or re-route around this step with moderate effort.

COUNTERMEASURES: Provide 2-4 specific, actionable defensive controls that would prevent, detect, or disrupt this step. Name specific control types, technologies, policies, or procedures. Avoid vague advice. Each countermeasure should directly attack one of the step's dependencies or objectives.

DIFFICULTY: Rate EASY, MODERATE, or HARD based on realistic implementation cost of the countermeasures.
- EASY: Standard security hygiene; most organizations can implement within weeks with existing resources.
- MODERATE: Requires dedicated effort, tooling investment, or cross-team coordination; achievable within a quarter.
- HARD: Requires significant resources, organizational change, or novel capability development; multi-quarter effort.

RESIDUAL RISK: If a defender breaks only this step and no others, what adversary capability remains? What alternate paths might they take?

CHAIN-LEVEL OUTPUT:

summary: 2-4 sentences summarizing the chain's overall threat logic, what the adversary is trying to achieve end-to-end, and the key insight about where the best defensive leverage lies. Write for a senior analyst briefing — clear, direct, no filler.

priority_steps: Array of step numbers ordered highest to lowest defensive priority. Lead with the step that most degrades adversary success probability if broken. Consider leverage rating, difficulty, and choke-point position.

chain_resilience: Rate the overall chain HIGH, MEDIUM, or LOW based on how hard it is to break.
- HIGH: Multiple redundant paths, few single points of failure, most break points are HARD. Adversary has strong positional advantage.
- MEDIUM: Meaningful break points exist but the adversary has fallback options. A well-resourced defender can interdict.
- LOW: Chain depends on brittle single-path logic or easily disrupted dependencies. A focused defensive response can collapse it.

Return ONLY valid JSON. No markdown fences, no explanation text outside the JSON. The response must be parseable by JSON.parse().

Output schema:
{
  "steps": [
    {
      "step_number": <integer matching input>,
      "adversary_objective": "<string>",
      "dependencies": "<string>",
      "leverage": "HIGH" | "MEDIUM" | "LOW",
      "countermeasures": ["<string>", "<string>", "<string>"],
      "difficulty": "EASY" | "MODERATE" | "HARD",
      "residual_risk": "<string>"
    }
  ],
  "summary": "<string>",
  "priority_steps": [<integer>, ...],
  "chain_resilience": "HIGH" | "MEDIUM" | "LOW"
}

Return one step object for every step in the input, in order. Do not skip steps, do not add steps. step_number values must exactly match the input.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    console.log('analyzeChainBreaker received:', JSON.stringify(payload).slice(0, 500));

    const { chain, scenarioContext = '' } = payload;

    if (!chain || !Array.isArray(chain.steps) || chain.steps.length === 0) {
      return Response.json({ error: 'chain with at least one step is required' }, { status: 400 });
    }

    const client = new Anthropic();

    const userMessage = [
      'Analyze this attack chain and return the structured break analysis as JSON.',
      '',
      `Chain: ${JSON.stringify(chain, null, 2)}`,
      scenarioContext ? `\nScenario Context:\n${scenarioContext}` : '',
    ].join('\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].text.trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw response:', raw.slice(0, 1000));
      return Response.json({ error: 'Model returned non-JSON response. Try again.' }, { status: 500 });
    }

    if (!Array.isArray(result.steps)) {
      return Response.json({ error: 'Unexpected response shape from model.' }, { status: 500 });
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in analyzeChainBreaker function:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
