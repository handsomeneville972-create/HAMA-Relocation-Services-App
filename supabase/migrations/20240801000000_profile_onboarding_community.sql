-- ============================================================
-- HAMA Consolidated Migration — Profile persistence, onboarding,
-- avatar storage, and community interaction counts
--
-- SAFE TO RE-RUN (fully idempotent). Run the WHOLE script in the
-- Supabase SQL editor, then run the VERIFY query at the bottom.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES: ensure columns exist
-- ------------------------------------------------------------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default true;

-- Make sure NOT NULL columns have defaults so inserts never fail
alter table public.profiles alter column role set default 'seeker';
alter table public.profiles alter column verification_level set default 'unverified';
alter table public.profiles alter column phone_verified set default false;

-- ------------------------------------------------------------
-- 2. PROFILES RLS: allow users to create their own profile row
-- ------------------------------------------------------------
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 3. update_profile RPC (security definer — bypasses RLS,
--    only updates the caller's own row)
-- ------------------------------------------------------------
create or replace function public.update_profile(
  p_display_name text default null,
  p_avatar_url text default null,
  p_username text default null,
  p_bio text default null,
  p_website text default null,
  p_onboarding_completed boolean default null,
  p_phone text default null,
  p_phone_verified boolean default null,
  p_verification_level text default null,
  p_email text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_row public.profiles;
begin
  if v_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    username,
    bio,
    website,
    phone,
    phone_verified,
    verification_level,
    role,
    onboarding_completed,
    updated_at
  )
  values (
    v_id,
    coalesce(p_email, (select email from public.profiles where id = v_id), (select email from auth.users where id = v_id)),
    coalesce(p_display_name, (select display_name from public.profiles where id = v_id)),
    coalesce(p_avatar_url, (select avatar_url from public.profiles where id = v_id)),
    case when p_username is null then (select username from public.profiles where id = v_id) else p_username end,
    case when p_bio is null then (select bio from public.profiles where id = v_id) else p_bio end,
    case when p_website is null then (select website from public.profiles where id = v_id) else p_website end,
    case when p_phone is null then (select phone from public.profiles where id = v_id) else p_phone end,
    case when p_phone_verified is null then (select phone_verified from public.profiles where id = v_id) else p_phone_verified end,
    case when p_verification_level is null then (select verification_level from public.profiles where id = v_id) else p_verification_level end,
    coalesce((select role from public.profiles where id = v_id), 'seeker'),
    case when p_onboarding_completed is null then (select onboarding_completed from public.profiles where id = v_id) else p_onboarding_completed end,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    username = excluded.username,
    bio = excluded.bio,
    website = excluded.website,
    phone = excluded.phone,
    phone_verified = excluded.phone_verified,
    verification_level = excluded.verification_level,
    onboarding_completed = excluded.onboarding_completed,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.update_profile to authenticated;
grant execute on function public.update_profile to service_role;

-- ------------------------------------------------------------
-- 4. handle_new_user trigger: create profile with username and
--    onboarding flag (new signups MUST complete onboarding)
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
    'https://i.pravatar.cc/150?u=' || new.id,
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
-- 5. AVATAR STORAGE: bucket + policies (idempotent)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can view avatars"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- ------------------------------------------------------------
-- 6. COMMUNITY COUNTS: triggers keep likes/bookmarks/comments
--    counts on community_posts in sync automatically
-- ------------------------------------------------------------
create or replace function public.maintain_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_like_count on public.community_post_likes;
create trigger trg_post_like_count
  after insert or delete on public.community_post_likes
  for each row execute function public.maintain_post_like_count();

create or replace function public.maintain_post_bookmark_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set bookmarks_count = bookmarks_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_posts set bookmarks_count = greatest(bookmarks_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_bookmark_count on public.community_post_bookmarks;
create trigger trg_post_bookmark_count
  after insert or delete on public.community_post_bookmarks
  for each row execute function public.maintain_post_bookmark_count();

create or replace function public.maintain_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comment_count on public.post_comments;
create trigger trg_post_comment_count
  after insert or delete on public.post_comments
  for each row execute function public.maintain_post_comment_count();

-- ------------------------------------------------------------
-- 7. RPCs: shares increment (views RPC already exists)
-- ------------------------------------------------------------
create or replace function public.is_username_taken(p_username text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username)
      and id <> auth.uid()
  );
$$;

grant execute on function public.is_username_taken to authenticated;

create or replace function public.increment_post_shares(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.community_posts set shares_count = shares_count + 1 where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_shares to authenticated;

create or replace function public.increment_post_views(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.community_posts set views_count = views_count + 1 where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_views to authenticated;

-- ============================================================
-- VERIFY — run this after the script. Expected: all columns
-- show, update_profile appears, 'avatars' bucket shows,
-- 3 count triggers show, and onboarding_completed = true.
-- ============================================================
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles' order by ordinal_position;
-- select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname in ('update_profile','increment_post_views','increment_post_shares');
-- select id, public, file_size_limit from storage.buckets where id = 'avatars';
-- select tgname from pg_trigger where tgname like 'trg_post_%';
-- select onboarding_completed, username from public.profiles limit 5;
