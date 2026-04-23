# AgentDebate

Structured multi-agent risk assessment platform. Build expert agent panels, run two-round red team sessions, and produce decision briefs — or drop into the **Live Debate Room** for a real-time streaming debate you can facilitate on the fly.

Multi-user, workspace-aware deployment backed by Supabase. All AI calls go directly from your browser to the Anthropic API using your own key.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- An [Anthropic API key](https://console.anthropic.com/) with Messages API access

---

## Supabase setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Note down your **Project URL** and **anon public key** from **Project Settings → API**.

### 2. Run the database migrations

Open the [SQL editor](https://supabase.com/dashboard/project/_/sql/new) for your project and run the migration files in order:

1. [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) — tables, triggers, Realtime config
2. [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql) — Row Level Security with workspace-scoped policies
3. [`supabase/migrations/003_debate.sql`](supabase/migrations/003_debate.sql) — Live Debate session mode and transcript storage
4. [`supabase/migrations/004_source_urls.sql`](supabase/migrations/004_source_urls.sql) — pinned source document support

Then run this additional fix to allow workspace bootstrap on first login:

```sql
create policy "workspaces_read_owner" on public.workspaces
  for select using (auth.uid() = owner_id);

create or replace function public.owns_workspace(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert" on public.workspace_members for insert with check (
  is_admin(workspace_id)
  or (
    auth.uid() = user_id
    and owns_workspace(workspace_id)
  )
);
```

### 3. Configure authentication

In your Supabase dashboard go to **Authentication → URL Configuration** and add your app's URL (e.g. `http://localhost:5173`) to **Redirect URLs**.

Optionally enable **Google OAuth** under **Authentication → Providers → Google** by supplying your Google OAuth client credentials.

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

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Both values are found in your Supabase dashboard under **Project Settings → API**.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing the app will display a **Setup Required** screen with instructions rather than a blank page.

---

## First-time use

1. Open the app and click **Sign up** to create an account
2. A workspace is automatically created for you on first login
3. Go to **Settings** and paste your Anthropic API key — stored encrypted in your workspace record so all workspace members share it

---

## Workflow

### Classic session

1. **Domains** — define the subject areas relevant to your assessment (e.g. *Cybersecurity*, *Supply Chain*)
2. **Agents** — build your expert panel; use **AI Generate** or **Import** from Markdown
3. **Scenarios** — create a scenario with a context document describing the system or threat environment
4. **Sessions → New Session → Classic** — assign agents, run Round 1 and Round 2, generate synthesis
5. **Results** — view synthesis, consensus findings, SCRS, threat chains, and chain-breaker analysis

### Live Debate Room

1. **Dashboard → Live Debate Room** (or **New Session → Live mode**)
2. Pin any reference URLs agents should consult during the debate
3. Assign agents and scenario, then click **Enter Debate Room**
4. Click **Round 1** to start — agent responses stream in live
5. Ask questions at any time to redirect agents or probe specific threats
6. Click **Round 2** after Round 1 completes, then **Synthesize** when done

See [USER_GUIDE.md](USER_GUIDE.md) for a full walkthrough of both modes, threat management, and facilitator controls.

---

## Agent import format

Agents can be bulk-imported from a `.md` file. Each block starts with an `##` heading:

```markdown
## Agent Name / Discipline

**Persona:** Who this expert is and how they think

**Cognitive Bias:** What they systematically underweight

**Primary Focus:** What they hunt for in an assessment

**Severity:** CRITICAL | HIGH | MEDIUM | LOW

**Vectors:**
- Human: 85
- Technical: 40
- Physical: 50
- Futures: 30

**Tags:** comma, separated, keywords

**Domain Tags:** Domain Name, Another Domain
```

Domains are matched by name (case-insensitive) or auto-created if they don't exist.

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, GitHub Pages, S3, etc.). Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your hosting platform's settings.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS + CSS variables |
| Routing | React Router v6 |
| Auth & database | Supabase (PostgreSQL + Row Level Security) |
| Realtime | Supabase Realtime (sessions, session agents, live transcripts) |
| AI | Anthropic API — claude-sonnet-4-6, claude-opus-4-7, claude-haiku-4-5 |
| Knowledge search | Wikipedia API (CORS-friendly, used by agent tool calls) |
| Charts | Recharts |
| Icons | Lucide React |
