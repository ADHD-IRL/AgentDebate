-- Link mitigations back to the session that produced them, so a session can
-- filter its own mitigations and the analysis flow stays connected.
alter table public.mitigations
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

create index if not exists mitigations_session on public.mitigations (session_id);
