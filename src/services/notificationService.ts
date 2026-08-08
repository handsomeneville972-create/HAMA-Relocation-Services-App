/**
 * HAMA Notification Service
 *
 * Queries user notifications from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, SEARCH_PAGE_SIZE } from './supabaseService';
import { MOCK_NOTIFICATIONS } from '../constants/data';
import type { Notification } from '../constants/types';

export async function getNotifications(
  userId: string,
): Promise<{ data: Notification[] | null; error: string | null }> {
  return executeQuery<Notification[]>(
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as Notification[] | null, error };
    },
    MOCK_NOTIFICATIONS,
  );
}

export async function getUnreadCount(
  userId: string,
): Promise<{ data: number; error: string | null }> {
  const result = await executeQuery<number>(
    async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      return { data: count ?? 0, error };
    },
    MOCK_NOTIFICATIONS.filter(n => !n.read).length,
  );
  return { data: result.data ?? 0, error: result.error };
}

export async function markAsRead(
  notificationId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      return { data: null, error };
    },
    null,
  );
}

export async function markAllAsRead(
  userId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      return { data: null, error };
    },
    null,
  );
}

export async function createNotification(notification: {
  userId: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  actionLink?: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          icon: notification.icon ?? null,
          action_link: notification.actionLink ?? null,
        })
        .select()
        .single();
      return { data, error };
    },
    null,
  );
}
