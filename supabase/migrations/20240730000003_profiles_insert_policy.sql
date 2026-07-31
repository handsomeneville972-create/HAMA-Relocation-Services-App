-- Fix: allow users to upsert their own profile row.
-- Without an INSERT policy, RLS blocks .upsert() on existing rows
-- (PostgREST upsert = INSERT ... ON CONFLICT DO UPDATE, needs both).

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
