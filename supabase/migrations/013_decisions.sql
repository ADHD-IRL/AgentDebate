-- Decision framing: wrap analysis around an actual design decision, the
-- options being compared, and the assumptions it rests on. Sessions run
-- per-option so risk can be compared side by side, and the decision record
-- captures what was chosen, by whom, and what was knowingly accepted.

create table if not exists public.decisions (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references public.workspaces(id) on delete cascade not null,
  title               text not null,
  description         text,
  acceptance_criteria text,
  status              text default 'framing'
                        check (status in ('framing','analyzing','decided','archived')),
  chosen_option_id    uuid,                       -- set when decided
  decision_rationale  text,
  decided_by          text,
  decided_at          timestamptz,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create table if not exists public.decision_options (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  decision_id  uuid references public.decisions(id) on delete cascade not null,
  name         text not null,
  description  text,
  sort_order   integer default 0,
  created_at   timestamptz default now() not null
);

create table if not exists public.decision_assumptions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  decision_id  uuid references public.decisions(id) on delete cascade not null,
  text         text not null,
  criticality  text default 'MEDIUM' check (criticality in ('LOW','MEDIUM','HIGH')),
  status       text default 'holds' check (status in ('holds','monitoring','invalidated')),
  created_at   timestamptz default now() not null
);

-- Sessions can be scoped to a decision + option
alter table public.sessions add column if not exists decision_id        uuid references public.decisions(id) on delete set null;
alter table public.sessions add column if not exists decision_option_id uuid references public.decision_options(id) on delete set null;

create index if not exists decisions_workspace on public.decisions (workspace_id);
create index if not exists decision_options_decision on public.decision_options (decision_id);
create index if not exists decision_assumptions_decision on public.decision_assumptions (decision_id);
create index if not exists sessions_decision on public.sessions (decision_id);

-- RLS
alter table public.decisions enable row level security;
alter table public.decision_options enable row level security;
alter table public.decision_assumptions enable row level security;

drop policy if exists "decisions_read" on public.decisions;
create policy "decisions_read"   on public.decisions for select using (is_member(workspace_id));
drop policy if exists "decisions_write" on public.decisions;
create policy "decisions_write"  on public.decisions for all using (can_write(workspace_id));

drop policy if exists "decision_options_read" on public.decision_options;
create policy "decision_options_read"  on public.decision_options for select using (is_member(workspace_id));
drop policy if exists "decision_options_write" on public.decision_options;
create policy "decision_options_write" on public.decision_options for all using (can_write(workspace_id));

drop policy if exists "decision_assumptions_read" on public.decision_assumptions;
create policy "decision_assumptions_read"  on public.decision_assumptions for select using (is_member(workspace_id));
drop policy if exists "decision_assumptions_write" on public.decision_assumptions;
create policy "decision_assumptions_write" on public.decision_assumptions for all using (can_write(workspace_id));
