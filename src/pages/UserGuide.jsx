import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Shield, Bot, Target, Link2, Swords, FileText, Globe, Lightbulb, AlertTriangle, CheckCircle2, Map, Brain, BarChart2, Mic2, Search, Zap } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const sections = [
  {
    id: 'what-is',
    icon: Globe,
    color: '#F0A500',
    title: 'What is AgentDebate?',
    content: `
AgentDebate is a **structured red-teaming platform** — a systematic way to stress-test plans, strategies, or decisions by simulating how adversaries, disruptors, or unexpected forces might exploit weaknesses.

Think of it like a **chess grandmaster reviewing a game before it's played**. Instead of reacting to problems after they happen, AgentDebate assembles a panel of expert "thinking styles" — called Agents — and forces them to imagine every way things could go wrong, from every angle simultaneously.

The core insight: **no single expert sees everything**. A cybersecurity specialist thinks differently than an economist, who thinks differently than a geopolitical analyst. AgentDebate structures a conversation between these perspectives so blind spots become visible before they become crises.

**What AgentDebate is NOT:**
- It's not a chatbot. It's a structured analytical framework.
- It's not a prediction engine. It surfaces risk — it doesn't forecast futures.
- It's not a replacement for human judgment. It's a tool to sharpen it.
    `,
  },
  {
    id: 'concepts',
    icon: Lightbulb,
    color: '#2E86AB',
    title: 'Core Concepts',
    subsections: [
      {
        icon: Globe,
        color: '#F0A500',
        title: 'Domains',
        body: `Domains are **organizational categories** — the broad buckets that your work, threats, and agents live inside. Think of them like departments in a university: "Cybersecurity," "Geopolitics," "Supply Chain." They don't do anything on their own, but they keep everything organized and color-coded so you can instantly see which discipline a piece of analysis belongs to.

**Set these up first.** Everything else (agents, scenarios, threats) can be tagged to a domain.`
      },
      {
        icon: Target,
        color: '#27AE60',
        title: 'Scenarios',
        body: `A Scenario is the **situation you want to stress-test**. It's your "what if" — the plan, decision, operation, or environment you're worried about.

Think of a scenario like the **brief given to a war game team**: "We are deploying a new LNG terminal in the Gulf of Aden. The context is X, the timeline is Y, and the constraints are Z."

The richer your scenario context document, the more targeted and useful the agent assessments will be. Use the AI Assist feature to expand a rough description into a full operational context document.

A scenario has a **status** (draft → active → archived) so you can track which ones are live.`
      },
      {
        icon: Bot,
        color: '#9B59B6',
        title: 'Agents',
        body: `Agents are **expert thinking archetypes** — personas that embody a specific discipline, cognitive style, and set of biases.

The analogy: imagine hiring a panel of consultants for a day. One is a former counterintelligence officer. One is a supply chain economist. One is a futurist. Each one looks at the same situation through a completely different lens. An Agent in AgentDebate captures that lens.

Each Agent has:
- **Discipline** — their professional identity (e.g., "HUMINT Officer," "Critical Infrastructure Engineer")
- **Persona Description** — who they are and how they think
- **Cognitive Bias** — what they systematically over- or under-weight (this is deliberate — biases create diversity of view)
- **Red Team Focus** — what specific threats they're hunting for
- **Vector Weights** — how much they emphasize Human, Technical, Physical, and Futures dimensions (0–100 each)
- **Severity Default** — their baseline alarm level (CRITICAL / HIGH / MEDIUM / LOW)
- **Voice** — used in Live Debate mode to give each agent a distinct spoken voice

You can build agents manually, generate them with AI, or import batches from a formatted Markdown file. You can also **create a new agent directly inside the session builder** using the "+ New Agent" button — it saves to your agent library and is immediately selected for the session.`
      },
      {
        icon: AlertTriangle,
        color: '#C0392B',
        title: 'Threats',
        body: `Threats are **named risk items** — specific, catalogued dangers associated with a scenario or domain. Think of them as entries in a risk register: "Supply chain compromise via tier-3 vendor," "Insider threat during transition period."

Threats live in the library and can be tagged, categorized, and linked to scenarios. They can also be AI-generated from a scenario context document. Threats are the *what* — Agents assess the *how bad* and *why it matters*.`
      },
      {
        icon: Link2,
        color: '#7B2D8B',
        title: 'Chains',
        body: `Chains are **compound multi-step sequences** — a structured narrative of how a threat unfolds over time, across multiple actors and disciplines.

The analogy: a Chain is like a **kill chain or attack tree**, but written in plain language. "Step 1: An insider with finance access exfiltrates procurement data. Step 2: A competitor uses that data to undercut bids. Step 3: Revenue erosion triggers a workforce reduction. Step 4: Key technical staff leave, creating a capability gap."

Each step can be attributed to an Agent or labeled freely. Chains can be built manually or AI-generated from a scenario.

**Chains are automatically extracted from synthesis.** When you generate a synthesis report, AgentDebate parses out any compound threat chains identified by the AI and saves them directly to your chain library — tagged to that session and scenario. You don't need to do anything manually.`
      },
      {
        icon: Swords,
        color: '#2E86AB',
        title: 'Sessions',
        body: `Sessions are where the **live red-teaming actually happens**. A session brings together a Scenario and a selected group of Agents to run a structured multi-round analysis.

Think of a Session like a **formal analytical war game**:
- You pick your scenario (the situation)
- You pick your panel (the agents)
- You run them through structured rounds of analysis
- You synthesize what they found

Sessions have two modes:
- **Classic Analysis** — structured two-round written assessment with synthesis
- **Live Debate** — real-time streaming debate where agents respond to each other with spoken voice, and you can interject with facilitator questions

Sessions track a **status** as they progress: pending → round1 → round2 → complete.`
      },
    ]
  },
  {
    id: 'workflow',
    icon: Swords,
    color: '#D68910',
    title: 'Running a Session: Step by Step',
    steps: [
      {
        num: '01',
        title: 'Create a Session',
        what: 'Name the session, select a Scenario, optionally set a Phase Focus (e.g., "design phase," "deployment week"), and choose which Agents will participate. You can select agents from your library or click "+ New Agent" to create and add one on the spot.',
        system: 'AgentDebate creates a Session record and a SessionAgent record for each selected agent, all initialized to "pending" status. New agents created here are simultaneously saved to the agent library and added to the session.',
        tip: 'Choose agents with diverse vector weights. If all your agents are Technical-heavy, you\'ll miss human and geopolitical risks. Use the AI Recommendations feature to get suggestions tuned to your scenario.'
      },
      {
        num: '02',
        title: 'Generate Round 1 — Independent Assessments',
        what: 'Click "Generate All Round 1" to run all agents, or click the individual generate button on any agent card to run just that one. Already-completed agents are never re-run — "Generate All" only processes agents that don\'t yet have a Round 1 assessment.',
        system: `For each agent that needs generation:
1. Sets the agent's status to "generating_r1"
2. Constructs a detailed prompt using the agent's persona, cognitive bias, red team focus, the scenario context document, phase focus, and any pinned chains
3. Sends this prompt to Claude (Anthropic's AI model) via streaming
4. The model responds in character — writing a structured threat assessment with findings, assumptions, a severity rating, and inline source citations
5. The assessment and severity are saved; status updates to "r1_done"
6. When the last agent completes manually (without using Generate All), the session status auto-advances to "round1"

Agents do NOT see each other's assessments in Round 1. This ensures independent thinking before cross-pollination.`,
        tip: 'Richer scenario context documents produce sharper, more targeted assessments. Use AI Assist on your scenario first. The "Generate All" button disables automatically once every agent has a completed assessment.'
      },
      {
        num: '03',
        title: 'Review Round 1 Results',
        what: 'Read each agent\'s independent assessment. Look for overlapping concerns (consensus signals) and stark disagreements (contested areas — often the most interesting).',
        system: 'Nothing runs automatically here. This is a human review step. You can edit any assessment manually, regenerate individual agents, or leave them as-is before proceeding.',
        tip: 'Agents that share very different severity ratings for similar threats are flagging genuine uncertainty — that\'s valuable intelligence.'
      },
      {
        num: '04',
        title: 'Generate Round 2 — Cross-Examination',
        what: 'Click "Generate All Round 2." Each agent now reads what every other agent found in Round 1 and produces a rebuttal — revising, reinforcing, or challenging. Same smart skip logic applies: already-completed agents are never re-run.',
        system: `For each Agent:
1. Compiles all other agents' Round 1 assessments into a single "others" block
2. Asks the agent to respond: who do they most agree with? Who do they most disagree with, and why? Does their severity change?
3. The model responds with a structured rebuttal including a revised severity, strongest ally identification, and a compound chain narrative
4. All results saved; when the last agent completes, session status auto-advances to "round2" and synthesis is triggered automatically`,
        tip: 'Round 2 is where the most interesting dynamics emerge — when the economist and the cyberspecialist fundamentally disagree on severity, that tension is worth exploring.'
      },
      {
        num: '05',
        title: 'Generate Synthesis',
        what: 'Click "Generate Synthesis." AgentDebate reads all Round 1 and Round 2 assessments and produces a single consolidated report. This also runs automatically when Round 2 completes.',
        system: `AgentDebate sends all agent assessments to Claude with instructions to act as a senior analytical director. The model identifies:
- Consensus findings (what most agents agree on)
- Contested findings (where agents significantly disagree)
- Compound chains (how threats chain together across disciplines)
- Blind spots (what was conspicuously absent)
- Priority mitigations (what to address first)
- Sharpest insights (the most incisive individual observations)

The synthesis is saved as a SessionSynthesis record, the session status moves to "complete," and any compound chains found are automatically saved to the chain library tagged to this session.`,
        tip: 'The synthesis is a starting point, not a final verdict. Use it to structure a human debrief. You can regenerate it at any time — re-running will update the existing synthesis record.'
      },
    ]
  },
  {
    id: 'live-debate',
    icon: Zap,
    color: '#F0A500',
    title: 'Live Debate Mode',
    subsections: [
      {
        icon: Zap,
        color: '#F0A500',
        title: 'What is Live Debate?',
        body: `Live Debate is the **real-time alternative to Classic Analysis**. Instead of structured rounds, agents respond to each other in a flowing conversation — more like a panel discussion than a formal assessment.

Choose Live Debate when you want:
- Dynamic back-and-forth between agents (not just independent assessments)
- A facilitator-directed conversation where you can interject, redirect, and challenge
- An observable, streaming experience where you watch agents think in real time
- Voice output — agents speak their responses aloud as they stream

**How it works:** You start the debate, agents take turns responding, and you can intervene at any point with a facilitator message that redirects the conversation.`
      },
      {
        icon: Mic2,
        color: '#9B59B6',
        title: 'Streaming Text-to-Speech',
        body: `In Live Debate, agents **speak as they write** — you don't wait for the full response to finish before hearing it. Each agent has an assigned voice (configurable in their profile), and sentences are spoken aloud the moment they complete streaming.

**How it works:**
- As the AI streams tokens, AgentDebate detects sentence boundaries in real time
- Each complete sentence is immediately sent to the voice engine and queued for playback
- Sentences play back-to-back with no gaps — the audio is seamless even though it's generated on the fly
- A speaking indicator shows which agent is currently talking
- You can mute voice output at any time with the speaker toggle

**Agent voices** are assigned per-agent in the agent settings (Alloy, Echo, Nova, Onyx, Fable, Shimmer). Give each agent a distinct voice to make the debate easier to follow aurally. You need an OpenAI API key configured in your workspace settings to enable TTS.`,
        usage: `
1. Set a voice for each agent in their profile (Agent Library → edit agent → Voice field).
2. When starting a Live Debate session, ensure your OpenAI API key is set in workspace settings.
3. Start the debate — agents will speak automatically as they respond.
4. The speaker icon in the agent card lights up to show which agent is currently speaking.
5. Click the speaker toggle (top-right of the debate room) to mute/unmute all voice output.
6. If no voice is set for an agent, that agent's responses will be text-only.
`
      },
    ]
  },
  {
    id: 'sources',
    icon: Search,
    color: '#27AE60',
    title: 'Session Sources & Evidence Tracking',
    subsections: [
      {
        icon: Search,
        color: '#27AE60',
        title: 'What are Session Sources?',
        body: `Every time an agent references a real-world source — a standard, a publication, a URL they fetched with a tool — AgentDebate captures it automatically and attaches it to the session. This creates a **complete evidence trail** for the session's analysis.

Sources are categorized into four credibility tiers:
- **Authoritative** — government agencies, military, academic institutions, official standards bodies (NIST, CISA, ENISA)
- **Credible** — established security publications, reputable news outlets, recognized research organizations (Reuters, SANS, MITRE, OWASP)
- **Speculative** — social media, blogs, opinion platforms (Reddit, Medium, LinkedIn)
- **Unverified** — domains that don't match known categories

Sources appear in the **SOURCES tab** of any session.`
      },
      {
        icon: Shield,
        color: '#2E86AB',
        title: 'How Sources are Captured',
        body: `Sources are captured in three ways:

**1. Tool-fetched URLs** — When an agent uses the fetch_url tool to retrieve a web page, the URL, domain, and a snippet of the content are automatically saved with the credibility score.

**2. Inline citations** — Agents are instructed to append citations directly in their text using the format:
\`[SOURCE: "Title or Name" — https://url.example.com]\`
or for sources without URLs:
\`[SOURCE: "NIST SP 800-53 Rev 5"]\`
These are parsed from the response text and saved with the citing sentence as context.

**3. Facilitator entries** — You can manually add a source via the "Add Source" button in the SOURCES tab. Use this to pin reference documents, standards, or external reports relevant to the session.

Each source row shows: the domain with credibility tier badge, the agent that cited it, and the exact sentence that referenced it.`
      },
      {
        icon: Brain,
        color: '#7B2D8B',
        title: 'AI Validity Analysis',
        body: `The **Run Validity Analysis** button in the SOURCES tab sends all captured sources and their citing claims to Claude for a cross-source analysis.

The AI evaluates:
- **Contradictions** — claims from different agents that are directly at odds with each other, along with an explanation of the conflict
- **Unsupported claims** — significant assertions made without any cited source
- **Key agreements** — claims that multiple sources independently corroborate
- **Overall confidence** — a HIGH / MEDIUM / LOW confidence rating for the session's evidence base

This analysis is particularly useful for auditing a session before presenting findings to leadership — it flags gaps and conflicts that need human judgment before the report is finalized.`,
        usage: `
1. Complete at least one debate round so agents have generated responses with citations.
2. Navigate to the **SOURCES tab** in the session workspace.
3. Review the automatically captured sources, grouped by credibility tier.
4. Add any missing reference documents using the **Add Source** button.
5. Click **Run Validity Analysis** — this sends all sources to AI for cross-analysis.
6. Review the Contradictions, Unsupported Claims, and Key Agreements sections.
7. Use findings to decide whether to regenerate specific agents with stronger sourcing instructions.
`
      },
    ]
  },
  {
    id: 'reports',
    icon: FileText,
    color: '#546E7A',
    title: 'Executive Report',
    subsections: [
      {
        icon: FileText,
        color: '#546E7A',
        title: 'Professional Report Format',
        body: `The **Print Report** button in the Synthesis tab generates a fully formatted multi-page executive report — suitable for leadership briefings, governance documentation, and audit trails.

The report is structured as four sections:

**1. Cover Page**
Session name, scenario name, phase focus, assessment date, number of participating agents, and a prominent overall risk badge (color-coded to the highest severity finding).

**2. Executive Dashboard**
- **Severity Distribution** — a donut chart showing how agent assessments distribute across CRITICAL / HIGH / MEDIUM / LOW
- **Risk Level Breakdown** — a horizontal bar chart showing agent counts per severity tier
- **Agent Risk Matrix** — a table with every agent's Round 1 severity, Round 2 severity, and confidence score, with color-coded cells
- **Agent Confidence Chart** — per-agent confidence bars with inline severity labels

**3. Compound Attack Chains**
Each chain identified in the synthesis is displayed as a numbered flowchart — step-by-step attack sequences with amber visual connectors.

**4. Synthesis Narrative**
The full AI-generated synthesis report with formatted headings, bullet points, and proper typography.

The report is fully print-ready — charts are inline SVG (no external dependencies) and render correctly in PDF export.`
      },
      {
        icon: CheckCircle2,
        color: '#27AE60',
        title: 'Use Cases',
        body: `**Leadership briefing** — the cover page and Executive Dashboard give decision-makers a one-page summary without requiring them to read the full analysis.

**Governance & audit** — the full report documents that structured pre-decision risk analysis was conducted, which agents participated, what they found, and what the consensus was.

**Project archive** — attach the PDF to a project record so future teams can see what risks were considered (and which were dismissed) at each phase.

**Stakeholder communication** — the Compound Attack Chains section is often the most persuasive part for non-technical audiences: it shows *how* a failure cascades, not just that a risk exists.`,
        usage: `
1. Complete a session through synthesis (session status must be "complete").
2. Navigate to the **SYNTHESIS tab** in the session workspace.
3. Click **🖨 Print Report** — a new window opens, auto-triggers the print dialog, then closes and returns focus to the app.
4. Choose **Save as PDF** in the print dialog to generate a PDF file.
5. The report opens with charts pre-rendered — no waiting for external assets.
`
      },
    ]
  },
  {
    id: 'threat-map',
    icon: Map,
    color: '#D68910',
    title: 'Threat Visualization & Analytics',
    subsections: [
      {
        icon: Map,
        color: '#D68910',
        title: 'Threat Heatmap',
        body: `The **Threat Heatmap** is a visual grid showing how severity assessments cluster across **agents and threat combinations**. It's a pattern-detection tool designed to surface consensus, disagreements, and outliers at a glance.

**What it shows:**
- **Rows** represent agents (ordered by overall severity bias)
- **Columns** represent threats or findings
- **Color intensity** reflects severity: bright red (CRITICAL) → orange (HIGH) → blue (MEDIUM) → green (LOW)

**How to use it:**
1. **Spot consensus** — columns with uniform color indicate strong agreement across the panel
2. **Find contested areas** — mixed-color columns highlight threats where severity estimates diverge (these are prime discussion points)
3. **Identify outliers** — watch for agents whose color patterns differ sharply from peers; they're flagging alternative interpretations
4. **Track severity trends** — compare heatmaps across multiple sessions to see how threat assessment evolves over time

**Pro tip:** Use the heatmap after Round 2 when severity values are finalized. Sort by "highest average" to see which threats dominate concern across the panel.`,
        usage: `
1. Navigate to **Threat Map** from the main menu.
2. Select a session to visualize its agent assessments.
3. The heatmap auto-loads, showing all agents and their severity ratings.
4. **Hover over cells** to see the agent's full assessment text.
5. **Click on a cell** to expand and read the complete rationale behind that severity rating.
6. Use the **domain filter** (top-right) to show only agents from a specific discipline.
7. Use the **sort options** to reorder agents by pessimism, optimism, or assessment count.
`
      },
      {
        icon: Brain,
        color: '#7B2D8B',
        title: 'Discipline Radar Chart',
        body: `The **Discipline Radar** visualizes how heavily agents from different **professional disciplines** are weighting five key threat dimensions: **Human, Technical, Physical, Futures, and Economic factors**.

Each discipline (e.g., "Cybersecurity," "Supply Chain," "Geopolitics") has its own radar profile — a star-shaped polygon showing where that discipline's attention concentrates.

**What it reveals:**
- **Spiky profiles** (uneven coverage) show disciplinary blind spots. A purely cybersecurity-focused team will be weak on geopolitical or supply chain angles.
- **Well-rounded profiles** (balanced coverage) indicate multidisciplinary awareness.
- **Overlapping radars** highlight where disciplines naturally agree, and **gaps** where they conflict.

**Use cases:**
- Identify which threat dimensions your agent panel neglects
- Diagnose why severity estimates diverge (often because different disciplines weight the Human vs. Technical trade-off differently)
- Validate that you've assembled sufficiently diverse expertise before running a session`,
        usage: `
1. From the Threat Map page, look for the **Discipline Radar** section.
2. The chart displays a colored polygon for each discipline represented in the current session.
3. **Each axis** represents a threat dimension (Human, Technical, Physical, Futures, Economic).
4. **Larger/longer rays** indicate higher emphasis by that discipline on that dimension.
5. **Compare radars visually** — overlapping areas show shared concern; gaps show disciplinary blind spots.
6. Hover over lines to see the exact percentages and disciplines.
7. Use this as input for **future session design**: if your radar is weak on "Futures," consider adding a futurist or strategic foresight specialist.
`
      },
      {
        icon: BarChart2,
        color: '#2E86AB',
        title: 'Severity Breakdown by Discipline',
        body: `The **Severity Breakdown** shows how each discipline's agents distribute their severity assessments across the four levels: CRITICAL, HIGH, MEDIUM, and LOW.

It's a stacked bar chart where each bar represents one discipline, and the colored segments show the proportion of assessments at each severity level.

**What it tells you:**
- **Red-heavy disciplines** (lots of CRITICAL/HIGH) are naturally pessimistic or focused on high-impact risks
- **Green-heavy disciplines** (lots of LOW/MEDIUM) tend toward more moderate threat assessment
- **Even distributions** suggest balanced, nuanced threat modeling

**Why it matters:**
When you see one discipline producing 70% CRITICAL ratings and another producing 70% MEDIUM ratings for the same threat, you've found a genuine analytical disagreement. That gap is often where the richest insights hide.`,
        usage: `
1. From the Threat Map page, locate the **Severity Breakdown by Discipline** bar chart.
2. Each bar represents one discipline with agents in the session.
3. The bar is divided into **colored segments** (CRITICAL, HIGH, MEDIUM, LOW).
4. The **width of each segment** shows the percentage of that discipline's assessments at that severity level.
5. Hover over a segment to see the exact count and percentage.
6. **Compare bars across disciplines** to spot which ones are pessimistic vs. optimistic.
7. Use the **domain filter** at the top to drill down or widen your view.
`
      }
    ]
  },
  {
    id: 'tips',
    icon: CheckCircle2,
    color: '#27AE60',
    title: 'Best Practices & Tips',
    tips: [
      {
        title: 'Build your agent library before your first session',
        body: 'The richer and more diverse your agent library, the more powerful your sessions. Aim for at least 8–12 agents spanning different disciplines. Use the AI generator or import from markdown to build quickly. You can also create agents on the fly inside the session builder with the "+ New Agent" button.'
      },
      {
        title: 'Write a thorough scenario context document',
        body: 'This is the single biggest lever on output quality. A thin scenario ("we\'re launching a product") produces thin assessments. A rich one ("we are launching X in market Y during period Z, with constraints A, B, C, and key dependencies D, E") produces sharp, specific findings. Use AI Assist to expand your draft.'
      },
      {
        title: 'Use Phase Focus to narrow scope',
        body: 'The "Phase Focus" field in a session lets you direct agents to a specific window of the scenario — "the first 90 days post-launch," "the procurement phase," "during board transition." This prevents generic analysis and forces agents to be precise.'
      },
      {
        title: 'Interpret severity disagreements as signals',
        body: 'When one agent rates a threat CRITICAL and another rates it LOW, that isn\'t noise — it\'s signal. It means the threat\'s impact is highly dependent on which domain lens you apply. Explore those gaps, not just the consensus.'
      },
      {
        title: 'Review sources before presenting findings',
        body: 'Open the SOURCES tab after a session and run Validity Analysis. It surfaces unsupported claims and inter-agent contradictions before you present. A finding with zero credible sources deserves more scrutiny than one backed by three authoritative citations.'
      },
      {
        title: 'Let synthesis auto-generate your chains',
        body: 'You don\'t need to manually build chains from session findings. Generate the synthesis report and AgentDebate automatically extracts and saves compound attack chains to your library. Review and edit them afterward if needed.'
      },
      {
        title: 'Use Live Debate for stakeholder engagement',
        body: 'Classic Analysis is best for rigorous documented assessment. Live Debate is better when you want to demonstrate the process to stakeholders — the streaming voice output makes the AI reasoning visible and engaging in a way that a written report cannot replicate.'
      },
      {
        title: 'Don\'t just run one session',
        body: 'The real power of AgentDebate accumulates over time. Run the same scenario with a different agent mix. Run sessions at different phases of a project. Compare how the severity distribution shifts as circumstances change. Use the Threat Heatmap across sessions to spot trends.'
      },
    ]
  },
];

function SubsectionWithUsage({ sub }) {
  const [usageOpen, setUsageOpen] = useState(false);
  
  return (
    <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <sub.icon className="w-4 h-4 flex-shrink-0" style={{ color: sub.color }} />
        <h3 className="text-sm font-bold font-mono tracking-wide" style={{ color: sub.color }}>{sub.title}</h3>
      </div>
      <div className="space-y-1">
        {sub.body.trim().split('\n').map((line, j) => {
          if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
            return <h4 key={j} className="text-xs font-bold mt-3 mb-1" style={{ color: 'var(--wr-text-primary)' }}>{line.slice(2, -2)}</h4>;
          }
          if (line.startsWith('- ')) {
            return <li key={j} className="text-xs ml-4 list-disc" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line.slice(2))}</li>;
          }
          if (line.trim() === '') return <div key={j} className="h-1.5" />;
          return <p key={j} className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line)}</p>;
        })}
      </div>
      
      {sub.usage && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--wr-border)' }}>
          <button
            onClick={() => setUsageOpen(!usageOpen)}
            className="flex items-center gap-2 text-xs font-bold tracking-widest font-mono transition-colors hover:opacity-80"
            style={{ color: sub.color }}>
            {usageOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            HOW TO USE
          </button>
          {usageOpen && (
            <div className="mt-3 pl-4 border-l-2 space-y-1" style={{ borderColor: `${sub.color}40` }}>
              {sub.usage.trim().split('\n').map((line, j) => {
                if (line.match(/^\d+\./)) {
                  const match = line.match(/^(\d+)\. (.+)/);
                  return (
                    <div key={j} className="flex gap-2 items-start">
                      <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: sub.color }}>{match[1]}.</span>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(match[2])}</p>
                    </div>
                  );
                }
                if (line.trim() === '') return <div key={j} className="h-1" />;
                return <p key={j} className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line)}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionContent({ section }) {
  if (section.content) {
    return (
      <div className="prose-warroom">
        {section.content.trim().split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
            return <h4 key={i} className="text-sm font-bold mt-4 mb-1" style={{ color: 'var(--wr-text-primary)' }}>{line.slice(2, -2)}</h4>;
          }
          if (line.startsWith('- ')) {
            return <li key={i} className="text-sm ml-4 list-disc" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line.slice(2))}</li>;
          }
          if (line.trim() === '') return <div key={i} className="h-2" />;
          return <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line)}</p>;
        })}
      </div>
    );
  }

  if (section.subsections) {
    return (
      <div className="space-y-5">
        {section.subsections.map((sub, i) => (
          <SubsectionWithUsage key={i} sub={sub} />
        ))}
      </div>
    );
  }

  if (section.steps) {
    return (
      <div className="space-y-4">
        {section.steps.map((step, i) => (
          <div key={i} className="rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)' }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
              <span className="text-lg font-black font-mono" style={{ color: 'var(--wr-amber)' }}>{step.num}</span>
              <h3 className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>{step.title}</h3>
            </div>
            <div className="p-4 space-y-4" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
              <div>
                <p className="text-xs font-bold tracking-widest mb-2 font-mono" style={{ color: 'var(--wr-text-muted)' }}>WHAT YOU DO</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{step.what}</p>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
                <p className="text-xs font-bold tracking-widest mb-2 font-mono" style={{ color: '#2E86AB' }}>WHAT THE SYSTEM DOES</p>
                <div className="space-y-1">
                  {step.system.trim().split('\n').map((line, j) => {
                    if (line.match(/^\d+\./)) {
                      const num = line.match(/^(\d+)\. (.+)/);
                      return (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-xs font-mono font-bold flex-shrink-0 mt-0.5" style={{ color: '#2E86AB' }}>{num[1]}.</span>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(num[2])}</p>
                        </div>
                      );
                    }
                    if (line.trim() === '') return <div key={j} className="h-1" />;
                    return <p key={j} className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{renderInline(line)}</p>;
                  })}
                </div>
              </div>
              {step.tip && (
                <div className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.15)' }}>
                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--wr-amber)' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{step.tip}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (section.tips) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {section.tips.map((tip, i) => (
          <div key={i} className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#27AE60' }} />
              <h4 className="text-xs font-bold" style={{ color: 'var(--wr-text-primary)' }}>{tip.title}</h4>
            </div>
            <p className="text-xs leading-relaxed ml-5" style={{ color: 'var(--wr-text-secondary)' }}>{tip.body}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--wr-text-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Section({ section }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className="rounded overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${section.color}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
          </div>
          <h2 className="text-sm font-bold tracking-wide font-mono" style={{ color: 'var(--wr-text-primary)' }}>{section.title}</h2>
        </div>
        {open ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /> : <ChevronRight className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />}
      </button>
      {open && (
        <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--wr-border)' }}>
          <div className="pt-5">
            <SectionContent section={section} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserGuide() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <PageHeader
        icon={BookOpen}
        title="USER GUIDE"
        subtitle="How to use AgentDebate — concepts, workflows, and best practices"
      />
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="rounded p-5 flex items-start gap-4" style={{ backgroundColor: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)' }}>
          <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--wr-amber)' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--wr-amber)' }}>Welcome to AgentDebate</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>
              This guide will walk you through every concept and workflow in the platform. If you're new, start with <strong style={{ color: 'var(--wr-text-primary)' }}>What is AgentDebate?</strong>, then read <strong style={{ color: 'var(--wr-text-primary)' }}>Core Concepts</strong> before running your first session.
            </p>
          </div>
        </div>

        <div className="rounded p-4 flex flex-wrap gap-2" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <span className="text-xs font-mono font-bold self-center mr-1" style={{ color: 'var(--wr-text-muted)' }}>JUMP TO:</span>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="text-xs px-2.5 py-1 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
              {s.title}
            </a>
          ))}
        </div>

        {sections.map(section => (
          <div key={section.id} id={section.id}>
            <Section section={section} />
          </div>
        ))}

        <div className="text-center py-6">
          <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>AgentDebate — Structured Red Team Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
