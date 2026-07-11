// Builds the prompt framing block for a Decision-Focus session, so the panel
// assesses ONE specific option of a decision rather than the scenario in the
// abstract. Prepended to scenarioContext at generation time.

export function buildDecisionFraming(decision, option, assumptions = []) {
  if (!decision || !option) return '';
  const lines = [];
  lines.push('=== DECISION UNDER EVALUATION ===');
  lines.push(`Decision: ${decision.title}`);
  if (decision.description) lines.push(decision.description);
  if (decision.acceptance_criteria) lines.push(`Acceptance criteria: ${decision.acceptance_criteria}`);
  lines.push('');
  lines.push(`OPTION BEING ASSESSED: ${option.name}`);
  if (option.description) lines.push(option.description);

  const live = (assumptions || []).filter(a => a.status !== 'invalidated');
  if (live.length) {
    lines.push('');
    lines.push('Key assumptions this decision rests on (flag any your analysis would break):');
    live.forEach(a => lines.push(`- [${a.criticality || 'MEDIUM'}] ${a.text}`));
  }

  lines.push('');
  lines.push('INSTRUCTION: Assess THIS OPTION specifically against the scenario below. Judge whether it meets the acceptance criteria, surface risks that are unique to this option (versus the alternatives), and call out any assumption your analysis would invalidate.');
  lines.push('=== END DECISION FRAMING ===');
  lines.push('');
  return lines.join('\n');
}
