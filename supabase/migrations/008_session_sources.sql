-- ── Session sources ───────────────────────────────────────────────────────────
-- Captures all sources referenced during a debate session: tool-fetched URLs,
-- inline agent citations, and facilitator-provided documents.

create table if not exists public.session_sources (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  session_id       uuid references public.sessions(id) on delete cascade not null,
  message_id       uuid,            -- links to session_messages row for traceability
  agent_id         uuid,            -- which agent cited/fetched this (null = facilitator)
  source_type      text not null,   -- 'tool_fetch' | 'agent_citation' | 'facilitator'
  url              text,
  title            text,
  domain           text,
  credibility_tier text,            -- 'authoritative' | 'credible' | 'speculative' | 'unverified'
  credibility_score integer,        -- 0–100
  cited_claim      text,            -- sentence that references this source
  content_snippet  text,            -- first 400 chars of fetched content
  created_at       timestamptz default now() not null
);

alter table public.session_sources enable row level security;

drop policy if exists "sources_read" on public.session_sources;
create policy "sources_read"   on public.session_sources for select using (is_member(workspace_id));
drop policy if exists "sources_insert" on public.session_sources;
create policy "sources_insert" on public.session_sources for insert with check (can_write(workspace_id));
drop policy if exists "sources_update" on public.session_sources;
create policy "sources_update" on public.session_sources for update using (can_write(workspace_id));
drop policy if exists "sources_delete" on public.session_sources;
create policy "sources_delete" on public.session_sources for delete using (can_write(workspace_id));
