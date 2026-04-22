-- AgentDebate — Live Debate mode additions
-- Run in Supabase SQL Editor after 001_schema.sql and 002_rls.sql

-- Add mode to sessions (classic = existing batch flow, live = streaming debate room)
alter table public.sessions
  add column if not exists mode text not null default 'classic'
  check (mode in ('classic', 'live'));

-- Live debate message transcript
create table if not exists public.session_messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  session_id   uuid references public.sessions(id)   on delete cascade not null,
  agent_id     uuid,                                  -- null = facilitator/system
  role         text not null check (role in ('agent','user','system')),
  content      text not null,
  round        integer,                               -- 1, 2, or null (open debate)
  metadata     jsonb default '{}',                    -- severity, etc.
  created_at   timestamptz default now() not null
);

alter table public.session_messages enable row level security;

create policy "messages_read"   on public.session_messages for select using (is_member(workspace_id));
create policy "messages_insert" on public.session_messages for insert with check (can_write(workspace_id));
create policy "messages_delete" on public.session_messages for delete using (is_admin(workspace_id));

alter publication supabase_realtime add table public.session_messages;
