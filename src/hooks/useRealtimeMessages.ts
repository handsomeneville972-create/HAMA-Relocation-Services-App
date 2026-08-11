/**
 * useRealtimeMessages
 *
 * Manages Supabase Realtime subscriptions for a conversation.
 * Uses Broadcast for live message delivery (scalable, secure).
 * Falls back to postgres_changes for persistence events.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Message } from '../constants/types';

interface RealtimeCallbacks {
  onNewMessage: (msg: Message) => void;
  onMessageEdited: (msgId: string, content: string, editedAt: string) => void;
  onMessageDeleted: (msgId: string) => void;
}

export function useRealtimeMessages(
  conversationId: string | null,
  currentUserId: string | null,
  callbacks: RealtimeCallbacks,
) {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`conversation:${conversationId}`);
    channelRef.current = channel;

    channel
      // Broadcast: new message delivery (primary channel)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const data = payload.payload as {
          message_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          attachment_url?: string;
          created_at: string;
          reply_to_id?: string;
        };

        // Don't process own messages (already added optimistically)
        if (data.sender_id === currentUserId) return;

        const msg: Message = {
          id: data.message_id,
          sender_id: data.sender_id,
          text: data.content || '',
          content: data.content,
          message_type: data.message_type as Message['message_type'],
          attachment_url: data.attachment_url || null,
          created_at: data.created_at,
          reply_to_id: data.reply_to_id || null,
          read: false,
        };

        callbacksRef.current.onNewMessage(msg);
      })
      // Broadcast: message edited
      .on('broadcast', { event: 'message_edited' }, (payload) => {
        const { message_id, content, edited_at } = payload.payload as {
          message_id: string;
          content: string;
          edited_at: string;
        };
        callbacksRef.current.onMessageEdited(message_id, content, edited_at);
      })
      // Broadcast: message deleted
      .on('broadcast', { event: 'message_deleted' }, (payload) => {
        const { message_id } = payload.payload as { message_id: string };
        callbacksRef.current.onMessageDeleted(message_id);
      })
      // Postgres Changes: fallback for missed broadcasts (e.g. offline → online)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as any;
          // Don't process own messages
          if (row.sender_id === currentUserId) return;

          const msg: Message = {
            id: row.id,
            sender_id: row.sender_id,
            text: row.text || row.content || '',
            content: row.content,
            message_type: row.message_type || 'text',
            attachment_url: row.attachment_url,
            created_at: row.created_at,
            reply_to_id: row.reply_to_id,
            read: row.read ?? false,
          };

          callbacksRef.current.onNewMessage(msg);
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, currentUserId]);

  // Send a broadcast event (for outgoing messages)
  const broadcast = useCallback(
    (event: string, payload: Record<string, any>) => {
      channelRef.current?.send({
        event,
        payload,
        type: 'broadcast',
      });
    },
    [],
  );

  return { isConnected, broadcast };
}
