-- ============================================================
-- 20240820000001_provider_publication.sql
-- Instant provider publication: extended service_providers table,
-- owner-insert RLS, and storage buckets for provider media.
-- All media stored at {user_id}/{file} so folder index 1 == owner.
-- ============================================================

-- ---- 1. Extend service_providers ----
alter table public.service_providers
  add column if not exists status        text not null default 'active',
  add column if not exists worker_type   text,
  add column if not exists pricing_type  text,
  add column if not exists starting_price numeric not null default 0,
  add column if not exists availability  boolean not null default true,
  add column if not exists profile       jsonb;

-- ---- 2. RLS: providers create their own row ----
create policy "Providers can create their own profile"
  on public.service_providers for insert
  with check (auth.uid() = user_id);

-- ---- 3. Storage buckets ----
insert into storage.buckets (id, name, public)
values
  ('provider-avatars', 'provider-avatars', true),
  ('provider-portfolio', 'provider-portfolio', true),
  ('provider-certificates', 'provider-certificates', false)
on conflict (id) do nothing;

-- Public read for avatars + portfolio
create policy "Provider avatars public read"
  on storage.objects for select
  using (bucket_id = 'provider-avatars');

create policy "Provider portfolio public read"
  on storage.objects for select
  using (bucket_id = 'provider-portfolio');

-- Authenticated-only read for certificates
create policy "Provider certificates authenticated read"
  on storage.objects for select
  using (bucket_id = 'provider-certificates' and auth.role() = 'authenticated');

-- Uploads: owner writes into their own folder ({user_id}/{file})
create policy "Provider avatars owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Provider portfolio owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-portfolio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Provider certificates owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-certificates' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can update/delete their own media
create policy "Provider media owner update"
  on storage.objects for update
  using (
    bucket_id in ('provider-avatars', 'provider-portfolio', 'provider-certificates') and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Provider media owner delete"
  on storage.objects for delete
  using (
    bucket_id in ('provider-avatars', 'provider-portfolio', 'provider-certificates') and
    auth.uid()::text = (storage.foldername(name))[1]
  );
