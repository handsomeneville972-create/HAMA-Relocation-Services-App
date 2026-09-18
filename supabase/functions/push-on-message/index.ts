// Supabase Edge Function: push-on-message
//
// Invoked by the `notify_new_message` trigger AFTER INSERT ON messages.
// Fans out to: (1) in-app `notifications` rows, (2) Expo Push API.
//
// Deploy:  supabase functions deploy push-on-message
// Secrets: supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function pushBody(msg: any): string {
  const t = msg.message_type || 'text';
  if (t === 'voice') return '🎤 Voice message';
  if (t === 'image') return '📷 Photo';
  if (t === 'file') return '📎 Attachment';
  if (t === 'system') return msg.text || msg.content || '';
  if (t === 'property' || t === 'product' || t === 'service_provider') {
    return `🏠 Shared a listing`;
  }
  const text = (msg.text || msg.content || '').trim();
  return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

serve(async (req: Request) => {
  try {
    const { message_id } = await req.json();
    if (!message_id) return new Response('missing message_id', { status: 400 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: msg } = await supabase
      .from('messages')
      .select('*')
      .eq('id', message_id)
      .single();
    if (!msg) return new Response('message not found', { status: 404 });

    // Recipients: all participants except the sender
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id, last_read_at')
      .eq('conversation_id', msg.conversation_id)
      .neq('user_id', msg.sender_id);

    if (!parts || parts.length === 0) return new Response('no recipients');

    // Sender display name
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name, display_name')
      .eq('id', msg.sender_id)
      .single();
    const senderName =
      (sender as any)?.display_name ||
      (sender as any)?.full_name ||
      'Someone';

    const pushMessages: any[] = [];

    for (const p of parts as any[]) {
      // Skip recipients already reading (last_read_at newer than the message)
      if (
        p.last_read_at &&
        new Date(p.last_read_at) >= new Date(msg.created_at)
      ) {
        continue;
      }

      // In-app notification row
      await supabase.from('notifications').insert({
        user_id: p.user_id,
        type: 'message',
        title: senderName,
        message: pushBody(msg),
        action_link: `/Chat?conversationId=${msg.conversation_id}`,
      });

      // Expo push (only if the recipient has a token)
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', p.user_id)
        .single();
      const token = (profile as any)?.push_token;
      if (typeof token === 'string' && token.startsWith('ExponentPushToken')) {
        pushMessages.push({
          to: token,
          sound: 'default',
          title: senderName,
          body: pushBody(msg),
          data: { conversationId: msg.conversation_id, messageId: msg.id },
          channelId: 'messages',
          badge: 1,
        });
      }
    }

    if (pushMessages.length > 0) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushMessages),
      });
    }

    return new Response(JSON.stringify({ sent: pushMessages.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
