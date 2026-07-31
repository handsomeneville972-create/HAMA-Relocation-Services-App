-- ============================================================
-- POST VIEWS
-- Adds a views counter to community posts and an RPC to
-- increment it atomically.
-- ============================================================

alter table public.community_posts
  add column if not exists views_count integer not null default 0;

-- Atomically increment the view counter for a post
create or replace function public.increment_post_views(post_id uuid)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  new_count integer;
begin
  update public.community_posts
     set views_count = views_count + 1
   where id = post_id
  returning views_count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_post_views(uuid) to authenticated;
grant execute on function public.increment_post_views(uuid) to anon;
