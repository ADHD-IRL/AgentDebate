export function buildGeneratePrompt(discipline, params) {
  return `You are building an expert agent profile for the AgentDebate strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${discipline}
Key focus area: ${params.scenario_name}
Prior background hints: Relevant to: ${(params.scenario_description || '').slice(0, 300)}

Return a JSON object with exactly these fields:
{ "name": "short descriptive name", "discipline": "2-4 word discipline label", "persona_description": "3-4 sentences", "professional_background": "2-3 sentences", "cognitive_bias": "1-2 sentences", "red_team_focus": "2-3 sentences", "expertise_level": "Senior", "reasoning_style": "Analytical", "severity_default": "HIGH", "vector_human": 50, "vector_technical": 50, "vector_physical": 30, "vector_futures": 40, "tags": ["tag1","tag2"], "epistemic_style": "1-2 sentences", "institutional_background": "1-2 sentences", "conflict_triggers": "1 sentence", "decision_style": "1 sentence", "adversary_model": "1 sentence", "institutional_incentives": "1 sentence", "analytical_framework": "1-2 sentences", "source_preferences": "1 sentence" }

Return ONLY the JSON object.`;
}

export function buildAssessPrompt(agent) {
  return `You are evaluating the completeness and quality of a Subject Matter Expert (SME) profile for use in strategic analysis debates.

Agent profile:
Name: ${agent.name}
Discipline: ${agent.discipline}
Persona Description: ${agent.persona_description || '(missing)'}
Professional Background: ${agent.professional_background || '(missing)'}
Cognitive Bias: ${agent.cognitive_bias || '(missing)'}
Red-Team Focus: ${agent.red_team_focus || '(missing)'}
Epistemic Style: ${agent.epistemic_style || '(missing)'}
Institutional Background: ${agent.institutional_background || '(missing)'}
Conflict Triggers: ${agent.conflict_triggers || '(missing)'}
Decision Style: ${agent.decision_style || '(missing)'}
Adversary Model: ${agent.adversary_model || '(missing)'}
Institutional Incentives: ${agent.institutional_incentives || '(missing)'}
Analytical Framework: ${agent.analytical_framework || '(missing)'}
Tags: ${(agent.tags || []).join(', ') || '(none)'}

Score this profile on a scale of 0-100 based on:
- Completeness (are the critical fields filled in?)
- Specificity (are descriptions operationally useful, not generic?)
- Internal consistency (does the persona hold together?)
- Distinctiveness (does this expert have a clear, unique voice?)

Return a JSON object:
{
  "score": 75,
  "summary": "2-3 sentence overall assessment",
  "gaps": ["list of specific missing or weak fields"],
  "strengths": ["list of what this profile does well"],
  "recommendations": ["actionable improvements"]
}

Return ONLY the JSON object.`;
}
