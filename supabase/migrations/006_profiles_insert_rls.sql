-- Add missing INSERT policy for profiles table so users can upsert their own profile row
-- (required for Supabase auth session recovery which does POST /profiles?on_conflict=id)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
