/**
 * useTypingIndicator
 *
 * Manages typing indicator state via Supabase Realtime Broadcast.
 * Emits typing events when the user is typing, listens for other users' typing.
 * Events are transient — not persisted to the database.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

const TYPING_THROTTLE_MS = 500;
const TYPING_TIMEOUT_MS = 3000;

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastEmitRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherUserTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        const { user_id } = payload.payload as { user_id: string };
        if (user_id !== currentUserId) {
          setIsOtherUserTyping(true);
          // Clear existing timeout
          if (otherUserTimeoutRef.current) {
            clearTimeout(otherUserTimeoutRef.current);
          }
          // Auto-hide after timeout
          otherUserTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, TYPING_TIMEOUT_MS);
        }
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        const { user_id } = payload.payload as { user_id: string };
        if (user_id !== currentUserId) {
          setIsOtherUserTyping(false);
          if (otherUserTimeoutRef.current) {
            clearTimeout(otherUserTimeoutRef.current);
          }
        }
      })
      .subscribe();

    return () => {
      if (otherUserTimeoutRef.current) {
        clearTimeout(otherUserTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const startTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastEmitRef.current < TYPING_THROTTLE_MS) return;
    lastEmitRef.current = now;

    channelRef.current?.send({
      event: 'typing_start',
      payload: { user_id: currentUserId },
      type: 'broadcast',
    });

    // Auto-stop after timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT_MS);
  }, [currentUserId]);

  const stopTyping = useCallback(() => {
    channelRef.current?.send({
      event: 'typing_stop',
      payload: { user_id: currentUserId },
      type: 'broadcast',
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentUserId]);

  return { isOtherUserTyping, startTyping, stopTyping };
}
