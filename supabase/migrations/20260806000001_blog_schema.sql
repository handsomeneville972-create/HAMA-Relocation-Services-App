-- ============================================================
-- HAMA Blog / Discover Schema
-- Migration: 20260806000001_blog_schema.sql
-- ============================================================

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
create table if not exists blog_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  description text,
  icon       text default 'document-text',
  position   int default 0,
  created_at timestamptz default now()
);

alter table blog_categories enable row level security;

create policy "public read categories"
  on blog_categories for select
  using (true);

create policy "admin manage categories"
  on blog_categories for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'hamisha_squad')
    )
  );

-- ============================================================
-- 2. AUTHORS
-- ============================================================
create table if not exists blog_authors (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete set null,
  name       text not null,
  slug       text unique not null,
  avatar_url text,
  bio        text,
  socials    jsonb default '{}',
  created_at timestamptz default now()
);

alter table blog_authors enable row level security;

create policy "public read authors"
  on blog_authors for select
  using (true);

create policy "admin manage authors"
  on blog_authors for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'hamisha_squad')
    )
  );

-- ============================================================
-- 3. POSTS
-- ============================================================
create table if not exists blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  excerpt         text,
  content         jsonb not null default '[]',
  cover_image_url text,
  category_id     uuid references blog_categories(id) on delete set null,
  author_id       uuid references blog_authors(id) on delete set null,
  tags            text[] default '{}',
  status          text not null default 'draft'
                    check (status in ('draft','published','scheduled')),
  published_at    timestamptz,
  updated_at      timestamptz default now(),
  featured        boolean default false,
  pinned          boolean default false,
  views           int default 0,
  shares          int default 0,
  reading_time    int,
  seo_title       text,
  seo_description text,
  og_image_url    text,
  related_property_ids  uuid[] default '{}',
  related_service_ids   uuid[] default '{}',
  related_product_ids   uuid[] default '{}',
  created_at      timestamptz default now()
);

alter table blog_posts enable row level security;

create policy "public read published posts"
  on blog_posts for select
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
  );

create policy "admin manage posts"
  on blog_posts for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'hamisha_squad')
    )
  );

-- Indexes
create index if not exists idx_blog_posts_status_published
  on blog_posts (status, published_at desc);

create index if not exists idx_blog_posts_slug
  on blog_posts (slug);

create index if not exists idx_blog_posts_featured
  on blog_posts (featured) where featured = true;

create index if not exists idx_blog_posts_category
  on blog_posts (category_id);

create index if not exists idx_blog_posts_tags
  on blog_posts using gin (tags);

-- ============================================================
-- 4. BOOKMARKS
-- ============================================================
create table if not exists blog_bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references blog_posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table blog_bookmarks enable row level security;

create policy "users read own bookmarks"
  on blog_bookmarks for select
  using (auth.uid() = user_id);

create policy "users toggle bookmarks"
  on blog_bookmarks for all
  using (auth.uid() = user_id);

-- ============================================================
-- 5. COMMENTS (schema-ready)
-- ============================================================
create table if not exists blog_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references blog_posts(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  parent_id  uuid references blog_comments(id) on delete cascade,
  content    text not null,
  status     text not null default 'pending'
               check (status in ('pending','approved','rejected','spam')),
  likes      int default 0,
  pinned     boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blog_comments enable row level security;

create policy "public read approved comments"
  on blog_comments for select
  using (status = 'approved');

create policy "users create comments"
  on blog_comments for insert
  with check (auth.uid() = user_id);

create policy "users update own comments"
  on blog_comments for update
  using (auth.uid() = user_id);

create policy "admin moderate comments"
  on blog_comments for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'hamisha_squad')
    )
  );

create index if not exists idx_blog_comments_post
  on blog_comments (post_id, status, created_at desc);

-- ============================================================
-- 6. EVENTS / ANALYTICS (schema-ready)
-- ============================================================
create table if not exists blog_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null
               check (type in ('view','read_complete','share','cta_click','search','bookmark')),
  post_id    uuid references blog_posts(id) on delete set null,
  user_id    uuid references auth.users(id) on delete set null,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);

alter table blog_events enable row level security;

create policy "authenticated insert events"
  on blog_events for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "admin read events"
  on blog_events for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'hamisha_squad')
    )
  );

create index if not exists idx_blog_events_type_post
  on blog_events (type, post_id, created_at desc);

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('blog-covers', 'blog-covers', true)
on conflict (id) do nothing;

-- Public read policy for blog-covers bucket
create policy "public read blog covers"
  on storage.objects for select
  using (bucket_id = 'blog-covers');

-- Authenticated upload to blog-covers
create policy "authenticated upload blog covers"
  on storage.objects for insert
  with check (
    bucket_id = 'blog-covers'
    and auth.role() = 'authenticated'
  );

-- ============================================================
-- 8. HELPER: auto-set reading_time on insert/update
-- ============================================================
create or replace function set_blog_reading_time()
returns trigger as $$
declare
  word_count int;
begin
  -- Estimate reading time from content blocks
  word_count := coalesce(
    (select sum(coalesce(length(terminal) / 5, 0))
     from jsonb_array_elements_text(new.content) as terminal),
    200
  );
  new.reading_time := greatest(1, round(word_count / 200.0)::int);
  return new;
end;
$$ language plpgsql;

create trigger trg_blog_reading_time
  before insert or update of content on blog_posts
  for each row
  execute function set_blog_reading_time();

-- ============================================================
-- 9. HELPER: auto-set updated_at on update
-- ============================================================
create or replace function set_blog_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_blog_updated_at
  before update on blog_posts
  for each row
  execute function set_blog_updated_at();
