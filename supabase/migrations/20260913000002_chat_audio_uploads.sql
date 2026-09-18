-- Allow voice-note audio uploads in the chat-attachments bucket.
-- (Previously image + PDF only; voice notes upload .m4a/.mp3/.wav.)

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a'
]
where id = 'chat-attachments';
