-- Organizational knowledge base: ingest design docs, prior incidents,
-- standards, and past assessments so agents can ground their analysis in
-- the organization's own material (retrieval-augmented prompting).
--
-- This MVP uses Postgres full-text retrieval (no embeddings provider needed).
-- A future upgrade can add pgvector + an embedding column for semantic search.

create table if not exists public.knowledge_documents (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title        text not null,
  source       text,                          -- e.g. 'design-doc', 'incident', 'standard'
  tags         text[] default '{}',
  content      text,
  created_at   timestamptz default now() not null
);

create table if not exists public.knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  document_id  uuid references public.knowledge_documents(id) on delete cascade not null,
  title        text,
  content      text not null,
  chunk_index  integer default 0,
  created_at   timestamptz default now() not null
);

create index if not exists knowledge_chunks_workspace on public.knowledge_chunks (workspace_id);
create index if not exists knowledge_chunks_document  on public.knowledge_chunks (document_id);
create index if not exists knowledge_chunks_fts on public.knowledge_chunks
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

drop policy if exists "kdocs_read" on public.knowledge_documents;
create policy "kdocs_read"  on public.knowledge_documents for select using (is_member(workspace_id));
drop policy if exists "kdocs_write" on public.knowledge_documents;
create policy "kdocs_write" on public.knowledge_documents for all using (can_write(workspace_id));

drop policy if exists "kchunks_read" on public.knowledge_chunks;
create policy "kchunks_read"  on public.knowledge_chunks for select using (is_member(workspace_id));
drop policy if exists "kchunks_write" on public.knowledge_chunks;
create policy "kchunks_write" on public.knowledge_chunks for all using (can_write(workspace_id));
