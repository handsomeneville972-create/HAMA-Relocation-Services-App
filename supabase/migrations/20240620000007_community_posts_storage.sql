-- Create community-posts storage bucket for community media (images + videos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-posts', 'community-posts', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/x-msvideo', 'video/x-matroska'])
on conflict (id) do nothing;

-- Allow authenticated users to upload their own community media
create policy "Users can upload their own community media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own community media
create policy "Users can update their own community media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own community media
create policy "Users can delete their own community media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to community media
create policy "Anyone can view community media"
on storage.objects for select
to public
using (bucket_id = 'community-posts');