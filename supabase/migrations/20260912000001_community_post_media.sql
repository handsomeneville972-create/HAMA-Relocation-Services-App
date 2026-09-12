-- ============================================================
-- HAMA Community Post Media Migration
--
-- Adds support for MULTIPLE images/videos per community post via
-- a child table (mirrors the product_images / property_images
-- pattern). The existing community_posts.image_url / video_url
-- columns are kept for backward compatibility with single-media
-- posts.
--
-- SAFE TO RE-RUN (fully idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table: community_post_media
-- ------------------------------------------------------------
create table if not exists public.community_post_media (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.community_posts(id) on delete cascade not null,
  media_url   text not null,
  media_type  text not null check (media_type in ('image', 'video')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.community_post_media enable row level security;

-- ------------------------------------------------------------
-- 2. RLS: anyone can view; authors manage their own post media
-- ------------------------------------------------------------
drop policy if exists "Anyone can view post media" on public.community_post_media;
create policy "Anyone can view post media"
  on public.community_post_media for select
  using (true);

drop policy if exists "Authors can insert post media" on public.community_post_media;
create policy "Authors can insert post media"
  on public.community_post_media for insert
  with check (
    exists (select 1 from public.community_posts where id = post_id and user_id = auth.uid())
  );

drop policy if exists "Authors can update post media" on public.community_post_media;
create policy "Authors can update post media"
  on public.community_post_media for update
  using (
    exists (select 1 from public.community_posts where id = post_id and user_id = auth.uid())
  );

drop policy if exists "Authors can delete post media" on public.community_post_media;
create policy "Authors can delete post media"
  on public.community_post_media for delete
  using (
    exists (select 1 from public.community_posts where id = post_id and user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------
create index if not exists idx_community_post_media_post_id
  on public.community_post_media(post_id);
create index if not exists idx_community_post_media_sort
  on public.community_post_media(post_id, sort_order);