const MODEL_MAP = {
  claude_sonnet_4_6: 'claude-sonnet-4-6',
  claude_opus_4_6:   'claude-opus-4-7',
  claude_haiku:      'claude-haiku-4-5-20251001',
};
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// Workspace key set by WorkspaceContext on load (takes priority)
let _workspaceApiKey = '';
export function setWorkspaceApiKey(key) { _workspaceApiKey = key || ''; }

export function getApiKey() {
  return _workspaceApiKey
    || localStorage.getItem('agd_anthropic_key')
    || import.meta.env.VITE_ANTHROPIC_KEY
    || '';
}

export function setApiKey(key) {
  localStorage.setItem('agd_anthropic_key', key);
}

export function getModelId() {
  const val = localStorage.getItem('agd_llm_model');
  return MODEL_MAP[val] || DEFAULT_MODEL;
}

export function setModelPref(val) {
  localStorage.setItem('agd_llm_model', val);
}

export async function callAnthropicStream({ messages, maxTokens = 2000, system, onToken, onDone }) {
  const key = getApiKey();
  if (!key) throw new Error('No Anthropic API key configured. Add it in Settings.');
  const body = { model: getModelId(), max_tokens: maxTokens, messages, stream: true };
  if (system) body.system = system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let streamError = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const event = JSON.parse(raw);
        if (event.type === 'error') {
          streamError = new Error(event.error?.message || 'Stream error from Anthropic API');
          break;
        }
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          fullText += event.delta.text;
          onToken?.(event.delta.text, fullText);
        }
      } catch {}
    }
    if (streamError) break;
  }
  if (streamError) throw streamError;
  onDone?.(fullText);
  return fullText;
}

export function parseSeverityFromText(text, fallback = 'HIGH') {
  const lines = text.trimEnd().split('\n');
  const last = lines[lines.length - 1];
  const m = last.match(/SEVERITY:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
  if (m) return { assessment: lines.slice(0, -1).join('\n').trim(), severity: m[1].toUpperCase() };
  return { assessment: text.trim(), severity: fallback };
}

async function callAnthropic({ messages, maxTokens = 2000, system }) {
  const key = getApiKey();
  if (!key) throw new Error('No Anthropic API key configured. Add it in Settings.');
  const body = { model: getModelId(), max_tokens: maxTokens, messages };
  if (system) body.system = system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || 'Anthropic API error');
  return data.content[0].text.trim();
}

// --- generateAgent ---
export async function generateAgent({ domain_id, expert_type, prior_background, key_focus, bias_toward }) {
  const prompt = `You are building an expert agent profile for the AgentDebate strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${expert_type}
Prior background hints: ${prior_background || 'none'}
Key focus area: ${key_focus || 'none'}
Known bias toward: ${bias_toward || 'none'}

Return a JSON object with exactly these fields:
{
  "name": "short descriptive name",
  "discipline": "2-4 word discipline label",
  "persona_description": "3-4 sentence description of who this expert is, how they think, what they prioritize",
  "cognitive_bias": "1-2 sentences describing what this expert systematically underweights or misses",
  "red_team_focus": "2-3 sentences on what this agent hunts for when analyzing any scenario",
  "severity_default": "CRITICAL or HIGH or MEDIUM",
  "vector_human": 50,
  "vector_technical": 50,
  "vector_physical": 30,
  "vector_futures": 40,
  "tags": ["array", "of", "3-5", "relevant", "tags"]
}

Return ONLY the JSON object.`;

  const text = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 1024 });
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

// --- generateRound1 ---
export async function generateRound1({ agent, scenarioContext, phaseFocus }) {
  const prompt = `You are ${agent.name}, ${agent.persona_description}
${agent.professional_background ? `Professional background: ${agent.professional_background}` : ''}
${agent.expertise_level ? `Expertise level: ${agent.expertise_level}` : ''}
${agent.reasoning_style ? `Reasoning style: ${agent.reasoning_style} — let this shape your argumentation and tone.` : ''}

Your cognitive bias: ${agent.cognitive_bias}
Your red-team focus: ${agent.red_team_focus}

SCENARIO CONTEXT:
${scenarioContext}

PHASE/FOCUS: ${phaseFocus || 'General analysis'}

Write a Round 1 independent threat/scenario assessment (350-500 words) covering:
1. Opening position — your primary framing from your discipline
2. Top threat — specific mechanism, what analysts are missing, severity (CRITICAL/HIGH/MEDIUM) with rationale
3. Second threat — same structure
4. Invalidating assumption — one assumption that if wrong changes your whole assessment
5. Key finding — one-sentence bottom line

After your assessment, on the very last line output exactly:
SEVERITY: [CRITICAL|HIGH|MEDIUM|LOW]

Write in first person as the expert. Be specific and opinionated.`;

  const fullText = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 1200 });
  const lines = fullText.split('\n');
  let severity = agent.severity_default || 'HIGH';
  let assessment = fullText;
  const lastLine = lines[lines.length - 1];
  const m = lastLine.match(/SEVERITY:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
  if (m) { severity = m[1].toUpperCase(); assessment = lines.slice(0, -1).join('\n').trim(); }
  return { assessment, severity };
}

// --- generateRound2 ---
export async function generateRound2({ agent, scenarioContext, phaseFocus, othersAssessments }) {
  const prompt = `You are ${agent.name}, ${agent.persona_description}
${agent.professional_background ? `Professional background: ${agent.professional_background}` : ''}
${agent.expertise_level ? `Expertise level: ${agent.expertise_level}` : ''}
${agent.reasoning_style ? `Reasoning style: ${agent.reasoning_style} — let this shape your argumentation and tone.` : ''}

Your cognitive bias: ${agent.cognitive_bias}

You have just read all Round 1 assessments from the other experts. Here they are:

${othersAssessments || '(No other assessments available yet)'}

Now write your Round 2 rebuttal (250-400 words) covering:
1. Strongest alliance — which agent's findings amplify yours most, and the compound threat chain that emerges (name them explicitly)
2. Strongest disagreement — which agent you most disagree with and exactly why (name them, cite their argument)
3. Whether you've revised your severity rating and why

After your rebuttal, on the very last line output exactly:
SEVERITY: [CRITICAL|HIGH|MEDIUM|LOW]

Be direct. Name names. Change your position if persuaded.`;

  const fullText = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 900 });
  const lines = fullText.split('\n');
  let severity = agent.severity_default || 'HIGH';
  let assessment = fullText;
  const lastLine = lines[lines.length - 1];
  const m = lastLine.match(/SEVERITY:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
  if (m) { severity = m[1].toUpperCase(); assessment = lines.slice(0, -1).join('\n').trim(); }
  return { assessment, severity };
}

// --- streaming variants ---
export async function generateRound1Stream({ agent, scenarioContext, phaseFocus, onToken, onDone }) {
  const prompt = `You are ${agent.name}, ${agent.persona_description}
${agent.professional_background ? `Professional background: ${agent.professional_background}` : ''}
${agent.expertise_level ? `Expertise level: ${agent.expertise_level}` : ''}
${agent.reasoning_style ? `Reasoning style: ${agent.reasoning_style} — let this shape your argumentation and tone.` : ''}

Your cognitive bias: ${agent.cognitive_bias}
Your red-team focus: ${agent.red_team_focus}

SCENARIO CONTEXT:
${scenarioContext}

PHASE/FOCUS: ${phaseFocus || 'General analysis'}

Write a Round 1 independent threat/scenario assessment (350-500 words) covering:
1. Opening position — your primary framing from your discipline
2. Top threat — specific mechanism, what analysts are missing, severity (CRITICAL/HIGH/MEDIUM) with rationale
3. Second threat — same structure
4. Invalidating assumption — one assumption that if wrong changes your whole assessment
5. Key finding — one-sentence bottom line

After your assessment, on the very last line output exactly:
SEVERITY: [CRITICAL|HIGH|MEDIUM|LOW]

Write in first person as the expert. Be specific and opinionated.`;

  return callAnthropicStream({ messages: [{ role: 'user', content: prompt }], maxTokens: 1200, onToken, onDone });
}

export async function generateRound2Stream({ agent, scenarioContext, phaseFocus, othersAssessments, onToken, onDone }) {
  const prompt = `You are ${agent.name}, ${agent.persona_description}
${agent.professional_background ? `Professional background: ${agent.professional_background}` : ''}
${agent.expertise_level ? `Expertise level: ${agent.expertise_level}` : ''}
${agent.reasoning_style ? `Reasoning style: ${agent.reasoning_style} — let this shape your argumentation and tone.` : ''}

Your cognitive bias: ${agent.cognitive_bias}

You have just read all Round 1 assessments from the other experts. Here they are:

${othersAssessments || '(No other assessments available yet)'}

Now write your Round 2 rebuttal (250-400 words) covering:
1. Strongest alliance — which agent's findings amplify yours most, and the compound threat chain that emerges (name them explicitly)
2. Strongest disagreement — which agent you most disagree with and exactly why (name them, cite their argument)
3. Whether you've revised your severity rating and why

After your rebuttal, on the very last line output exactly:
SEVERITY: [CRITICAL|HIGH|MEDIUM|LOW]

Be direct. Name names. Change your position if persuaded.`;

  return callAnthropicStream({ messages: [{ role: 'user', content: prompt }], maxTokens: 900, onToken, onDone });
}

export async function generateAgentReply({ agent, question, priorMessages, scenarioContext, onToken, onDone }) {
  const contextLines = (priorMessages || []).slice(-6).map(m =>
    m.agentName ? `${m.agentName}: ${m.content.slice(0, 300)}` : `Facilitator: ${m.content}`
  ).join('\n\n');

  const prompt = `You are ${agent.name}, ${agent.persona_description}
Your cognitive bias: ${agent.cognitive_bias}
Your red-team focus: ${agent.red_team_focus}

SCENARIO CONTEXT:
${(scenarioContext || '').slice(0, 1500)}

RECENT DEBATE CONTEXT:
${contextLines || '(debate just started)'}

The facilitator has asked: "${question}"

Respond in character (100-180 words). Be direct and opinionated. No headings or bullet lists — speak naturally as the expert you are.`;

  return callAnthropicStream({ messages: [{ role: 'user', content: prompt }], maxTokens: 400, onToken, onDone });
}

// --- Tool use for live debate ---

export const DEBATE_TOOLS = [
  {
    name: 'search_knowledge',
    description: 'Search for factual information: historical events, threat actors, geopolitical context, technical concepts, known incidents. Use when the question requires specific facts you want to verify.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Specific search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch and read the content of a specific public URL (news article, report, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL starting with https://' },
      },
      required: ['url'],
    },
  },
];

async function runSearchKnowledge(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pages = searchData.query?.search || [];
    if (!pages.length) return 'No results found for this query.';

    const top = pages[0];
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${top.pageid}&prop=extracts&exintro=true&explaintext=true&exsectionformat=plain&format=json&origin=*`;
    const extractRes = await fetch(extractUrl);
    const extractData = await extractRes.json();
    const page = Object.values(extractData.query.pages)[0];
    const text = (page?.extract || top.snippet?.replace(/<[^>]+>/g, '') || '').slice(0, 1500);

    const related = pages.slice(1).map(p => p.title).join(', ');
    return `[Wikipedia: ${top.title}]\n${text}${related ? `\n\nRelated: ${related}` : ''}`;
  } catch (e) {
    return `Search failed: ${e.message}`;
  }
}

async function runFetchUrl(url) {
  try {
    if (!url.startsWith('https://')) return 'Only https:// URLs are supported.';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 2000);
    return text || 'No readable content found at this URL.';
  } catch (e) {
    return `Fetch failed: ${e.message}`;
  }
}

export async function executeToolCall(name, input) {
  if (name === 'search_knowledge') return runSearchKnowledge(input.query);
  if (name === 'fetch_url') return runFetchUrl(input.url);
  return `Unknown tool: ${name}`;
}

export async function generateAgentReplyWithTools({ agent, question, priorMessages, scenarioContext, sourcePins = [], onToolCall, onDone }) {
  const key = getApiKey();
  if (!key) throw new Error('No Anthropic API key configured. Add it in Settings.');

  const contextLines = (priorMessages || []).slice(-6)
    .map(m => m.agentName ? `${m.agentName}: ${m.content.slice(0, 200)}` : `Facilitator: ${m.content}`)
    .join('\n\n');

  const pinsSection = sourcePins.length > 0
    ? `\nPINNED SOURCE DOCUMENTS (use fetch_url to read any of these when relevant):\n${sourcePins.map((p, i) => `${i + 1}. ${p.label ? `"${p.label}" — ` : ''}${p.url}`).join('\n')}`
    : '';

  const system = `You are ${agent.name}, ${agent.persona_description}
Your cognitive bias: ${agent.cognitive_bias}
Your red-team focus: ${agent.red_team_focus}

SCENARIO CONTEXT:
${(scenarioContext || '').slice(0, 800)}
${pinsSection}
RECENT DEBATE CONTEXT:
${contextLines || '(debate just started)'}`;

  const userMsg = `The facilitator has asked: "${question}"

Use tools if you need specific facts, recent incidents, or technical detail — including any pinned source documents above. Then give your in-character expert response (100-180 words). No headings or bullet lists — speak naturally.`;

  const messages = [{ role: 'user', content: userMsg }];
  const toolCallLog = [];

  for (let i = 0; i < 4; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getModelId(),
        max_tokens: 800,
        system,
        tools: DEBATE_TOOLS,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error ${res.status}`);
    }

    const data = await res.json();
    const hasToolUse = data.content.some(b => b.type === 'tool_use');

    if (!hasToolUse || data.stop_reason === 'end_turn') {
      const text = data.content.find(b => b.type === 'text')?.text?.trim() || '';
      onDone?.(text, toolCallLog);
      return { text, toolCalls: toolCallLog };
    }

    messages.push({ role: 'assistant', content: data.content });

    const toolResults = [];
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue;
      const tc = { name: block.name, input: block.input };
      toolCallLog.push(tc);
      onToolCall?.(tc);
      const result = await executeToolCall(block.name, block.input);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  // Safety fallback — strip tools and get plain response
  const fallback = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: getModelId(), max_tokens: 400, system, messages: [{ role: 'user', content: userMsg }] }),
  });
  const fallbackData = await fallback.json();
  const text = fallbackData.content?.[0]?.text?.trim() || '';
  onDone?.(text, toolCallLog);
  return { text, toolCalls: toolCallLog };
}

// --- generateSynthesis ---
function extractSection(text, heading) {
  const regex = new RegExp(`##\\s*${heading}[\\s\\S]*?(?=\\n---\\n|\\n## |$)`, 'i');
  const match = text.match(regex);
  if (!match) return '';
  return match[0].replace(/^##[^\n]*\n/, '').trim();
}

function parseCompoundChains(chainsText) {
  if (!chainsText) return [];
  if (/unable to generate|no.*assessment|no.*data/i.test(chainsText)) return [];
  const chains = [];
  const blocks = chainsText.split(/\n(?=###\s|(?:\d+\.|\*\*)[^\n]+)/).filter(b => b.trim());
  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (!lines.length) continue;
    const rawTitle = lines[0].replace(/^(###|\d+\.|\*\*)\s*/, '').replace(/\*\*/g, '').trim();
    if (!rawTitle || rawTitle.length < 3) continue;
    const bodyText = lines.slice(1).join('\n').trim();
    const stepLines = bodyText.split('\n').filter(l => /^(step\s*\d+|→|\d+\.|[-•])/i.test(l.trim()));
    const steps = stepLines.map((line, i) => ({
      step_number: i + 1,
      agent_id: '',
      agent_label: '',
      step_text: line.replace(/^(step\s*\d+[:\-]?|→|\d+\.|[-•])\s*/i, '').trim(),
    })).filter(s => s.step_text.length > 0);
    chains.push({ name: rawTitle, description: bodyText.substring(0, 300), steps });
  }
  return chains;
}

export async function generateSynthesis({ session, sessionAgents, scenarioContext }) {
  const truncated = (scenarioContext || '').substring(0, 1500);
  const agentsText = sessionAgents.map(sa => {
    const parts = [`=== ${sa.agentName} (${sa.discipline}) ===`];
    if (sa.round1_assessment) {
      parts.push(`ROUND 1 [${sa.round1_severity}]:`);
      parts.push((sa.round1_assessment || '').substring(0, 500));
    }
    if (sa.round2_rebuttal) {
      parts.push(`ROUND 2 [${sa.round2_revised_severity}]:`);
      parts.push((sa.round2_rebuttal || '').substring(0, 400));
    }
    return parts.join('\n');
  }).join('\n\n---\n\n');

  const prompt = `You are the AgentDebate synthesis engine. You have received all agent assessments from a structured two-round red team analysis session.

Session: ${session.name}
Phase Focus: ${session.phase_focus || 'General'}

Scenario Context:
${truncated}

ALL AGENT ASSESSMENTS:
${agentsText}

Generate a comprehensive synthesis report covering:

## CONSENSUS FINDINGS
(Points that multiple agents agreed on, sorted by severity)

## CONTESTED FINDINGS
(Points of significant disagreement between agents — format as "Agent A vs Agent B: [the disagreement]")

## COMPOUND CHAINS
(Multi-step threat sequences that emerged from agents building on each other's work. Format each chain EXACTLY as:
### [Chain Name]
Step 1: [description]
Step 2: [description]
Step 3: [description]
List 2-4 chains. Each must have at least 3 steps.)

## BLIND SPOTS
(Areas or threat vectors that no agent adequately covered)

## PRIORITY MITIGATIONS
(Numbered list of recommended immediate actions, based on the highest-severity consensus findings)

## SHARPEST INSIGHTS
(5 most important or surprising specific statements from individual agents, with attribution)

Write analytically. Be specific. Cite agents by name.`;

  const synthesis = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 1800 });
  const chainsSection = extractSection(synthesis, 'COMPOUND CHAINS');
  const compound_chains = parseCompoundChains(chainsSection);
  return { synthesis, compound_chains, synthesis_url: null };
}

// --- generateThreats ---
export async function generateThreats({ scenarioContext, scenarioName }) {
  const prompt = `You are a strategic threat analyst for the AgentDebate intelligence platform.

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

  const text = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 2048 });
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

// --- generateChain ---
export async function generateChain({ scenarioContext, agentList, chain_type, num_steps, focus_area }) {
  const agentListText = agentList.map(a => `- ${a.name} (${a.discipline})`).join('\n');
  const prompt = `You are generating a compound scenario chain for the AgentDebate strategic analysis system.

A chain is a multi-step sequence showing how a scenario, threat, or adversary operation unfolds across multiple disciplines.

Scenario Context:
${scenarioContext || '(no specific scenario provided)'}

Available Agent Disciplines:
${agentListText}

Chain Type: ${chain_type}
Focus Area: ${focus_area || 'general'}
Number of Steps: ${num_steps}

Generate a compound chain with ${num_steps} steps. Return a JSON object:
{
  "name": "Evocative chain name in quotes",
  "description": "2-3 sentence summary of what this chain represents",
  "steps": [
    {
      "step_number": 1,
      "agent_label": "Agent name or discipline label from the list above",
      "step_text": "Clear description of what happens in this step and why it matters"
    }
  ]
}

Return ONLY the JSON.`;

  const text = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 2048 });
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

// --- scenarioAiAssist ---
export async function scenarioAiAssist({ context }) {
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

  const improved = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 2000 });
  return { improved };
}

// --- fetchUrlScenario ---
export async function fetchUrlScenario({ url }) {
  let html;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    throw new Error(`Could not fetch URL (CORS may be blocking it): ${e.message}`);
  }
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000);

  const prompt = `You are a red team analyst preparing a scenario briefing.

Given the following web page content, extract and synthesize the most relevant information into a concise, structured scenario context document. Focus on:
- Key facts, events, or situation details
- Threat actors, vulnerabilities, or risks mentioned
- Organizational or technical environment described
- Any timelines, impacts, or consequences

Web page content:
---
${text}
---

Output a clean scenario context document (3-6 paragraphs). No disclaimers.`;

  const context = await callAnthropic({ messages: [{ role: 'user', content: prompt }], maxTokens: 2000 });
  return { context };
}

// --- analyzeChainBreaker ---
const CHAIN_BREAKER_SYSTEM = `You are a senior red team analyst specializing in adversarial chain analysis and defensive countermeasure development. Your job is to dissect multi-step attack chains and identify exactly where defenders should intervene to prevent adversary success.

You will receive a JSON input with two fields:
- chain: an object with name, description, and steps (array of { step_number, agent_label, step_text })
- scenarioContext: optional free-text scenario context

For each step assess: adversary objective, dependencies, leverage (HIGH/MEDIUM/LOW), countermeasures (2-4 specific controls), difficulty (EASY/MODERATE/HARD), residual risk.

Also provide: summary, priority_steps (array of step numbers), chain_resilience (HIGH/MEDIUM/LOW).

Return ONLY valid JSON matching this schema exactly:
{
  "steps": [{ "step_number": 1, "adversary_objective": "", "dependencies": "", "leverage": "HIGH", "countermeasures": [""], "difficulty": "EASY", "residual_risk": "" }],
  "summary": "",
  "priority_steps": [1],
  "chain_resilience": "HIGH"
}`;

export async function analyzeChainBreaker({ chain, scenarioContext = '' }) {
  const userMessage = [
    'Analyze this attack chain and return the structured break analysis as JSON.',
    '',
    `Chain: ${JSON.stringify(chain, null, 2)}`,
    scenarioContext ? `\nScenario Context:\n${scenarioContext}` : '',
  ].join('\n');

  const raw = await callAnthropic({
    system: CHAIN_BREAKER_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 4096,
  });

  let result;
  try { result = JSON.parse(raw); }
  catch { throw new Error('Model returned non-JSON response. Try again.'); }
  if (!Array.isArray(result.steps)) throw new Error('Unexpected response shape from model.');
  return result;
}

// --- deleteAgents (no LLM needed) ---
export async function deleteAgents({ agent_ids, db }) {
  for (const id of agent_ids) {
    await db.Agent.delete(id);
  }
  return { deleted: agent_ids.length };
}
