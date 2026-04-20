# AgentDebate

Structured multi-agent risk assessment platform. Build expert agent panels, run two-round red team sessions, generate threat chains, and produce decision briefs with a live Systemic Critical Risk Score (SCRS).

Runs entirely in the browser — no backend, no database, no accounts. All data is stored in localStorage. All AI calls go directly from your browser to the Anthropic API using your own key.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API key](https://console.anthropic.com/) with Messages API access

---

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/ADHD-IRL/AgentDebate.git
cd AgentDebate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## First-time configuration

When you open the app for the first time:

1. Go to **Settings** in the left sidebar
2. Paste your Anthropic API key into the **API Key** field
3. Click **Test** to verify the key works
4. Select your preferred model (Sonnet is recommended for most use cases)
5. Click **Save Settings**

Your API key is stored only in your browser's localStorage and is never sent anywhere except directly to Anthropic.

---

## Workflow

Once your API key is configured, the recommended workflow is:

### Step 1 — Add domains
Go to **Domains** and create the subject areas relevant to your assessment (e.g. *Cybersecurity*, *Supply Chain*, *Human Factors*).

### Step 2 — Build your agent panel
Go to **Agents** and add expert agents. Each agent has a discipline, expertise level, cognitive bias, and red-team focus. Use **AI Generate** to have the model create a full agent profile from a short description, or build one manually.

### Step 3 — Define a scenario
Go to **Scenarios** and create a scenario with a context document describing the system, situation, or threat environment to be assessed. Paste in text directly, fetch from a URL, or use **AI Assist** to expand a rough draft into a detailed briefing.

### Step 4 — Run a session
Go to **Sessions**, create a new session, assign your agents and scenario, then run Round 1 (independent assessments) and Round 2 (cross-agent rebuttals). Generate the synthesis when both rounds are complete.

### Step 5 — Analyse results
- **Reports** — view the synthesis, consensus findings, and agent-level breakdowns
- **What-If Simulator** — toggle countermeasures on/off and watch the SCRS update live
- **Chain Breaker** — select a threat chain and get step-by-step defensive analysis
- **Decision Brief** — generate a printable one-page stakeholder summary

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy the contents of `dist/` to any static host (Vercel, Netlify, GitHub Pages, S3, etc.).

---

## Data storage

All data (agents, domains, scenarios, sessions, analyses) is stored in your browser's `localStorage` under the `agd_` prefix. There is no server-side persistence — clearing your browser storage will remove all data.

To back up or transfer your data, use the workspace export/import feature in the Settings area.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS + CSS variables |
| Routing | React Router v6 |
| AI | Anthropic API (direct browser calls) |
| Storage | Browser localStorage |
| Charts | Recharts |
| Icons | Lucide React |
