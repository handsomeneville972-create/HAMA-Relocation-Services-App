/**
 * Push Notification Service
 *
 * Handles Expo push notification token registration, storage,
 * and notification listeners for HAMA messaging.
 *
 * Uses expo-notifications for token generation and local notifications.
 * Stores push tokens in the profiles table for server-side sending.
 *
 * NOTE: Requires `expo-notifications` to be installed:
 *   npx expo install expo-notifications
 */

import { Platform } from 'react-native';
import { supabase } from '../utils/supabaseClient';

let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
      // Configure how notifications appear when app is in foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      return null;
    }
  }
  return Notifications;
}

/**
 * Register for push notifications and store the token in the profiles table.
 * Should be called once after user logs in.
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<{ token: string | null; error: string | null }> {
  try {
    const Notifs = await getNotifications();
    if (!Notifs) {
      return { token: null, error: 'expo-notifications not installed' };
    }

    // Only works on physical devices
    const Device = await import('expo-device');
    if (!Device.default.isDevice) {
      return { token: null, error: 'Push notifications require a physical device' };
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifs.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifs.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { token: null, error: 'Notification permissions not granted' };
    }

    // Get the Expo push token
    const tokenData = await Notifs.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Update the profiles table with the push token
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: pushToken })
      .eq('id', userId);

    if (error) {
      console.error('Failed to store push token:', error.message);
      return { token: pushToken, error: error.message };
    }

    // Android-specific: set notification channel
    if (Platform.OS === 'android') {
      await Notifs.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifs.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B00',
      });
    }

    return { token: pushToken, error: null };
  } catch (err: any) {
    return { token: null, error: err?.message ?? 'Failed to register for notifications' };
  }
}

/**
 * Set up notification listeners.
 * Returns cleanup function to remove listeners.
 *
 * - onReceive: called when notification received while app is foregrounded
 * - onTap: called when user taps a notification
 */
export async function setupNotificationListeners(handlers: {
  onReceive?: (notification: any) => void;
  onTap?: (response: any) => void;
}): Promise<() => void> {
  const Notifs = await getNotifications();
  if (!Notifs) return () => {};

  const receiveSubscription = Notifs.addNotificationReceivedListener(
    (notification) => {
      handlers.onReceive?.(notification);
    },
  );

  const responseSubscription = Notifs.addNotificationResponseReceivedListener(
    (response) => {
      handlers.onTap?.(response);
    },
  );

  return () => {
    receiveSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Clear all notification badges (called when user opens the app).
 */
export async function clearBadge(): Promise<void> {
  const Notifs = await getNotifications();
  if (Notifs) {
    await Notifs.setBadgeCountAsync(0);
  }
}

/**
 * Remove the push token from the database (called on logout).
 */
export async function removePushToken(userId: string): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ push_token: null })
      .eq('id', userId);
  } catch {
    // Silently fail — cleanup is best-effort
  }
}
