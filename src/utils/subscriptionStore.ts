/**
 * HAMA Subscription Mirror Store
 *
 * Local mirror of the user's active subscription. The authoritative record
 * lives in Supabase (user_subscriptions), written by the payment server on
 * successful M-Pesa callbacks. This store keeps entitlement instant and
 * offline-safe; SubscriptionContext reconciles both.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubscriptionTier, UserType } from '../constants/types';

const STORAGE_KEY = 'hama_subscription_v1';

export interface LocalSubscription {
  planId: string;
  tier: SubscriptionTier;
  userType: UserType;
  price: number;
  status: 'active' | 'trial';
  startedAt: string;
  expiresAt: string | null;
  /** M-Pesa receipt number when paid via STK push */
  mpesaReceipt?: string;
}

let current: LocalSubscription | null = null;

type Listener = (sub: LocalSubscription | null) => void;
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((l) => l(current ? { ...current } : null));
}

/** Load persisted subscription (call once at app start). */
export async function loadSubscriptionStore(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) current = JSON.parse(raw) as LocalSubscription;
  } catch {
    current = null;
  }
  emit();
}

export function getLocalSubscription(): LocalSubscription | null {
  return current ? { ...current } : null;
}

/** Persist an activated subscription after successful payment. */
export async function recordSubscription(sub: LocalSubscription): Promise<void> {
  current = { ...sub };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // keep in-memory state
  }
  emit();
}

export async function clearLocalSubscription(): Promise<void> {
  current = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // keep in-memory state
  }
  emit();
}

export function subscribeToSubscriptionStore(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
