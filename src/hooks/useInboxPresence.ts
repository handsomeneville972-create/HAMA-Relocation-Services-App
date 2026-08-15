/**
 * useInboxPresence
 *
 * Joins a global presence channel shared by every HAMA app instance, so the
 * inbox can show which conversation partners are online right now
 * (TikTok-style "Active Now" strip and green rings on avatars).
 *
 * Online source of truth:
 *   1. Presence channel ("presence:hama") — realtime, per-app-instance.
 *   2. user_presence table fallback — last_seen_at within the timeout window.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

const PRESENCE_TIMEOUT_MS = 120_000; // 2 minutes — after this, considered offline

export function useInboxPresence(currentUserId: string | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Live presence channel
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('presence:hama');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id && p.user_id !== currentUserId) ids.add(p.user_id);
          });
        });
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // DB fallback: refresh online users from user_presence every 30s
  useEffect(() => {
    if (!currentUserId) return;

    const refreshFromDb = async () => {
      try {
        const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS).toISOString();
        const { data } = await supabase
          .from('user_presence')
          .select('user_id')
          .gt('last_seen_at', cutoff);

        if (data) {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            data.forEach((row) => {
              if (row.user_id !== currentUserId) next.add(row.user_id);
            });
            return next;
          });
        }
      } catch {
        // Non-critical — skip
      }
    };

    refreshFromDb();
    const timer = setInterval(refreshFromDb, 30_000);
    return () => clearInterval(timer);
  }, [currentUserId]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUserIds.has(userId),
    [onlineUserIds],
  );

  return { onlineUserIds, isUserOnline };
}
