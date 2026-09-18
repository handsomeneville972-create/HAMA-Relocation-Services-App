-- Chat push fan-out: notify Edge Function on every new message.
--
-- SETUP (one-time, in Supabase Dashboard → SQL editor or via `supabase db push`):
--   1. Replace <PROJECT_REF> and <ANON_KEY> below with your project's values.
--   2. Deploy the function:  supabase functions deploy push-on-message --no-verify-jwt
--      (--no-verify-jwt because pg_net calls carry no user JWT; the function
--       uses SERVICE_ROLE_KEY internally and only needs a message_id.)
--   3. Set function secrets:
--      supabase secrets set SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
--        SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
--
-- The function skips recipients already reading (last_read_at), writes an
-- in-app `notifications` row, and POSTs to the Expo Push API.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  func_url text := 'https://<PROJECT_REF>.supabase.co/functions/v1/push-on-message';
begin
  perform net.http_post(
    url := func_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('message_id', NEW.id)
  );
  return NEW;
exception when others then
  -- Never fail the message insert because push failed.
  return NEW;
end;
$$;

drop trigger if exists on_messages_notify on public.messages;
create trigger on_messages_notify
  after insert on public.messages
  for each row
  execute function public.notify_new_message();

-- Fast lookup of push tokens during fan-out.
create index if not exists idx_profiles_push_token
  on public.profiles (push_token)
  where push_token is not null;
