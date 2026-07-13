-- Add missing INSERT policy for profiles table so users can upsert their own profile row
-- (required for Supabase auth session recovery which does POST /profiles?on_conflict=id)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
