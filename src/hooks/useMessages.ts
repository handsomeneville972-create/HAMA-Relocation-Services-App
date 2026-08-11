/**
 * useMessages
 *
 * Paginated message loading for a conversation.
 * Initially loads the latest N messages, then loads older messages
 * when the user scrolls up.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Message } from '../constants/types';

const DEFAULT_PAGE_SIZE = 30;

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const oldestTimestampRef = useRef<string | null>(null);

  // Load initial messages (latest N)
  const loadInitial = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setHasMore(true);
    oldestTimestampRef.current = null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(DEFAULT_PAGE_SIZE);

      if (error) {
        console.error('Failed to load messages:', error);
        return;
      }

      const fetched = (data ?? []).reverse() as Message[];
      setMessages(fetched);

      if (fetched.length > 0) {
        oldestTimestampRef.current = fetched[0].created_at!;
      }

      setHasMore(data?.length === DEFAULT_PAGE_SIZE);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || isLoadingMore || !oldestTimestampRef.current) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .lt('created_at', oldestTimestampRef.current)
        .order('created_at', { ascending: false })
        .limit(DEFAULT_PAGE_SIZE);

      if (error) {
        console.error('Failed to load older messages:', error);
        return;
      }

      const older = (data ?? []).reverse() as Message[];

      if (older.length > 0) {
        oldestTimestampRef.current = older[0].created_at!;
        setMessages((prev) => [...older, ...prev]);
      }

      setHasMore(data?.length === DEFAULT_PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore]);

  // Add a new message (from realtime or optimistic)
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      // Deduplicate
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Update an existing message (edit event)
  const updateMessage = useCallback((msgId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, ...updates } : m)),
    );
  }, []);

  // Remove a message (delete event)
  const removeMessage = useCallback((msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }, []);

  // Replace an optimistic message with the real one
  const replaceOptimistic = useCallback((tempId: string, realMsg: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? realMsg : m)),
    );
  }, []);

  // Remove a failed optimistic message
  const removeOptimistic = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadInitial,
    loadMore,
    addMessage,
    updateMessage,
    removeMessage,
    replaceOptimistic,
    removeOptimistic,
    setMessages,
  };
}
