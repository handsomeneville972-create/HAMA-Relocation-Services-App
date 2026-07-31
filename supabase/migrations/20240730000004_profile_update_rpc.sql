-- ============================================================
-- PROFILE UPDATE RPC
-- A security-definer function that lets a user upsert their own
-- profile row. Bypasses RLS (which blocks client .upsert() when
-- INSERT/UPDATE policies are missing) but still enforces that the
-- caller may only modify their own row.
-- ============================================================

-- Ensure editable columns exist (idempotent, so this migration is
-- self-sufficient even if earlier ones were not fully applied)
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website text;

-- Ensure users can insert their own profile row (needed for upsert fallback)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.update_profile(
  p_display_name text default null,
  p_avatar_url  text default null,
  p_username    text default null,
  p_bio         text default null,
  p_website     text default null
) returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  target_id uuid := auth.uid();
  updated  public.profiles;
begin
  if target_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name, avatar_url, username, bio, website, updated_at)
  values (target_id, p_display_name, p_avatar_url, p_username, p_bio, p_website, now())
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url   = excluded.avatar_url,
        username     = excluded.username,
        bio          = excluded.bio,
        website      = excluded.website,
        updated_at   = now()
  returning * into updated;

  return updated;
end;
$$;

grant execute on function public.update_profile(text, text, text, text, text) to authenticated;
