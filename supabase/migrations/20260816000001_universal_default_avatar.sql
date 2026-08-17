-- ============================================================
-- HAMA Universal Default Avatar Migration
--
-- New users should have NO avatar_url in the database (the app
-- renders a universal HAMA-gradient default avatar instead of a
-- random pravatar image). This migration:
--   1. Recreates handle_new_user so new signups get avatar_url = NULL
--   2. Clears legacy pravatar.cc avatar URLs from existing profiles
--   3. Clears legacy pravatar.cc object URLs from storage.references
--
-- SAFE TO RE-RUN (fully idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. handle_new_user: no more random pravatar avatar on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, username, role, onboarding_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    null,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data ->> 'role', 'seeker'),
    false
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Clear legacy pravatar URLs from existing profiles
-- ------------------------------------------------------------
update public.profiles
set avatar_url = null,
    updated_at = now()
where avatar_url is not null
  and (avatar_url like 'https://i.pravatar.cc/%' or avatar_url like '%pravatar.cc%');

-- ------------------------------------------------------------
-- 3. Clear legacy pravatar URLs from storage references
-- ------------------------------------------------------------
delete from storage.objects
where bucket_id = 'avatars'
  and name like '%pravatar%';