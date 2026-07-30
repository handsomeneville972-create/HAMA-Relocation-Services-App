-- Add username, bio, and website columns to profiles table
alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists website text;

-- Ensure unique constraint on username (soft — allows null)
create unique index if not exists idx_profiles_username on public.profiles (username)
  where username is not null;

-- Auto-generate default username from email for existing users
update public.profiles
set username = split_part(email, '@', 1)
where username is null and email is not null;
