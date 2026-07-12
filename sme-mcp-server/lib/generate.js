export function buildGeneratePrompt(discipline, params) {
  return `You are building an expert agent profile for the AgentDebate strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${discipline}
Key focus area: ${params.scenario_name}
Prior background hints: Relevant to: ${(params.scenario_description || '').slice(0, 300)}

Return a JSON object with exactly these fields. Make every field specific to THIS expert — a bona fide human SME knows the edge of their competence, applies named methods, has a characteristic bias AND a habit to counter it, and treats false-negatives vs false-positives asymmetrically:
{ "name": "short descriptive name", "discipline": "2-4 word discipline label", "persona_description": "3-4 sentences", "professional_background": "2-3 sentences", "cognitive_bias": "1-2 sentences", "debiasing_instruction": "1 sentence: the self-correction habit countering that bias", "red_team_focus": "2-3 sentences", "expertise_level": "Senior", "role_type": "sme", "reasoning_style": "Analytical", "severity_default": "HIGH", "vector_human": 50, "vector_technical": 50, "vector_physical": 30, "vector_futures": 40, "tags": ["tag1","tag2"], "epistemic_style": "1-2 sentences", "source_preferences": "1 sentence: preferred evidence/collection types", "institutional_background": "1-2 sentences", "conflict_triggers": "1 sentence", "decision_style": "1 sentence", "adversary_model": "1 sentence", "institutional_incentives": "1 sentence", "analytical_framework": "1-2 sentences: named methods", "domain_expertise": { "sub-dimension label": 8, "another": 5 }, "expertise_boundaries": { "strong": ["..."], "moderate": ["..."], "weak": ["..."], "defer_to": ["..."], "forbidden_overreach": "what this SME must never claim as fact" }, "tradecraft": { "common_indicators": ["..."], "common_false_positives": ["..."], "failure_modes": ["..."] }, "risk_posture": { "risk_sensitivity": "high", "false_negative_tolerance": "low", "false_positive_tolerance": "medium", "escalation_bias": "short phrase" }, "debate_behavior": { "debate_role": "...", "rebuttal_style": "...", "what_changes_mind": "..." }, "update_triggers": { "fast_when": "...", "slow_when": "...", "resistant_when": "..." } }

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
Source Preferences: ${agent.source_preferences || '(missing)'}
Tags: ${(agent.tags || []).join(', ') || '(none)'}

— Human-matching dimensions (weight these HIGHEST; they most separate a bona fide expert from a confident generalist) —
Domain Fluency: ${JSON.stringify(agent.domain_expertise || {})}
Expertise Boundaries (strong/weak/defer_to/forbidden_overreach): ${JSON.stringify(agent.expertise_boundaries || {})}
Debiasing Instruction (should pair with the cognitive bias): ${agent.debiasing_instruction || '(missing)'}
Tradecraft (indicators/false_positives/failure_modes): ${JSON.stringify(agent.tradecraft || {})}
Risk Posture (FP/FN asymmetry): ${JSON.stringify(agent.risk_posture || {})}
Debate Behavior: ${JSON.stringify(agent.debate_behavior || {})}
Belief-Update Rules: ${JSON.stringify(agent.update_triggers || {})}

Score this profile on a scale of 0-100 based on:
- Completeness (are the critical fields filled in?)
- Specificity (are descriptions operationally useful, not generic?)
- Internal consistency (does the persona hold together?)
- Distinctiveness (does this expert have a clear, unique voice?)
- Human-matching depth (WEIGHTED HIGHEST): does it declare its competence boundaries and defer outside them, pair its bias with a debiasing habit, express a false-negative/false-positive asymmetry, and give concrete belief-update rules? A profile missing these should not score above 70 however polished its prose.

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
