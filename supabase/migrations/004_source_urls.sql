-- Add pinned source documents to sessions (Live Debate mode)
alter table public.sessions
  add column if not exists source_pins jsonb not null default '[]';
