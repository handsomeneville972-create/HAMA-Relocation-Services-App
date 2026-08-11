/**
 * usePresence
 *
 * Tracks online/offline presence via Supabase Realtime Presence.
 * Also maintains a heartbeat that updates user_presence.last_seen_at
 * in the database for "Last seen X ago" fallback.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../utils/supabaseClient';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const PRESENCE_TIMEOUT_MS = 120_000; // 2 minutes — after this, user is considered offline

export function usePresence(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update own presence in database
  const updatePresence = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('user_presence')
        .upsert(
          { user_id: currentUserId, last_seen_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
    } catch {
      // Silently fail — presence is non-critical
    }
  }, [currentUserId]);

  // Join presence channel for this conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`presence:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = new Set<string>();
        const presenceData: Record<string, string> = {};

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            userIds.add(p.user_id);
            if (p.last_seen_at) {
              presenceData[p.user_id] = p.last_seen_at;
            }
          });
        });

        setOnlineUsers(userIds);
        setLastSeen(presenceData);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handled by sync
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handled by sync
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          });
        }
      });

    // Initial presence update
    updatePresence();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, updatePresence]);

  // Heartbeat: update last_seen_at periodically
  useEffect(() => {
    if (!currentUserId) return;

    heartbeatRef.current = setInterval(() => {
      updatePresence();
      // Also update presence state on the channel
      channelRef.current?.track({
        user_id: currentUserId,
        online_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [currentUserId, updatePresence]);

  // Handle app state changes (background = stop heartbeat, foreground = resume)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        updatePresence();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [updatePresence]);

  // Helper: check if a specific user is online
  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers],
  );

  // Helper: get last seen for a user
  const getUserLastSeen = useCallback(
    (userId: string) => lastSeen[userId] || null,
    [lastSeen],
  );

  // Helper: compute "Last seen X ago" string
  const formatLastSeen = useCallback((userId: string): string | null => {
    const ts = lastSeen[userId];
    if (!ts) return null;

    const diff = Date.now() - new Date(ts).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [lastSeen]);

  return {
    onlineUsers,
    isUserOnline,
    getUserLastSeen,
    formatLastSeen,
  };
}
