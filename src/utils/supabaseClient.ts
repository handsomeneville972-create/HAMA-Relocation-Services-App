/**
 * Supabase client for HAMA
 *
 * SECURITY NOTES:
 * - Uses SUPABASE_ANON_KEY only (safe for client-side, protected by RLS)
 * - NEVER import or expose SUPABASE_SERVICE_ROLE_KEY in this file
 * - Session persisted via SecureStore/AsyncStorage with auto-refresh
 * - detectSessionInUrl: false (required for React Native — no URL redirects)
 */
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Retrieve credentials from app.config.js extra field
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing credentials. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env and app.config.js.',
  );
}

export const SUPABASE_URL = supabaseUrl;

const isWeb = Platform.OS === 'web';

/**
 * Secure token storage adapter for Supabase auth tokens.
 * Uses expo-secure-store on devices that support it,
 * falls back to AsyncStorage for web/test environments.
 */
const tokenStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: tokenStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // Needed on web for email verification callback
    flowType: 'pkce',
  },
});

/**
 * Returns the correct redirect URL for auth flows.
 * On web: uses the current page origin (e.g. http://localhost:8081)
 * On native: uses the app deep link scheme
 */
export const getAuthRedirectUrl = (path: string = 'auth/callback'): string => {
  if (isWeb && typeof window !== 'undefined') {
    return `${window.location.origin}/${path}`;
  }
  return `hama://${path}`;
};

/**
 * Get the current authenticated Supabase user.
 * Returns null if not authenticated.
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Get the current session.
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
