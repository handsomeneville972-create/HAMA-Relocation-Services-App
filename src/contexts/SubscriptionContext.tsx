/**
 * SubscriptionContext
 *
 * Single source of truth for entitlements: the user's local subscription
 * mirror (AsyncStorage) + the seeker free-trial state. Backend (Supabase)
 * remains authoritative — the mirror is reconciled via
 * syncSubscriptionFromSupabase whenever the user signs in.
 *
 * House seeker flow:
 *   1. 7-day free trial → Premium features unlocked
 *   2. Trial ends → user must pay KSh 170/month
 *   3. isSeekerLocked = !trialActive && !isSubscribed
 *      When true: Marketplace blurred, Services gated, Home cards gated
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLocalSubscription,
  loadSubscriptionStore,
  subscribeToSubscriptionStore,
  LocalSubscription,
} from '../utils/subscriptionStore';
import { getTrialState, loadTrial, subscribeTrial, TrialState } from '../utils/trial';
import { SubscriptionTier, UserType } from '../constants/types';
import { syncSubscriptionFromSupabase } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

const TRIAL_NOTIF_KEY = 'hama_trial_notif_v1';

export const TIER_RANK: Record<SubscriptionTier, number> = {
  Free: 0,
  Basic: 1,
  Premium: 2,
  Pro: 3,
};

export interface PlanEntitlement {
  /** Active (non-expired) subscription for the given role, if any */
  subscription: LocalSubscription | null;
  /** Seeker trial state (only relevant for the seeker role) */
  trial: TrialState;
  /** True if the seeker's 7-day trial is currently active */
  trialActive: boolean;
  /** True if the seeker's trial ran out and no seeker subscription replaced it */
  trialEnded: boolean;
  /** True if the user has an active paid subscription for the seeker role */
  isSubscribed: boolean;
  /** True if the seeker is locked out of premium features (not trial, not subscribed) */
  isSeekerLocked: boolean;
  /** True if a previously active paid subscription has expired */
  subscriptionExpired: boolean;
  /** True if the 5-minute trial notification has been shown this trial period */
  trialNotificationShown: boolean;
  /** Mark the trial notification as shown (persisted to AsyncStorage) */
  markTrialNotificationShown: () => void;
  /**
   * True if the user may use `tier` features for `role`.
   * Free is always allowed; trial counts as Premium for seekers.
   */
  isEntitled: (role: UserType, tier: SubscriptionTier) => boolean;
  /** Highest tier the user currently holds for the given role */
  effectiveTier: (role: UserType) => SubscriptionTier;
  /** Re-read local stores (and reconcile with Supabase when signed in) */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<PlanEntitlement | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { currentUserId } = useAuth();
  const [subscription, setSubscription] = useState<LocalSubscription | null>(null);
  const [trial, setTrial] = useState<TrialState>(getTrialState());
  const [trialNotificationShown, setTrialNotificationShown] = useState(false);

  // Load both stores on mount + subscribe to changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all([loadTrial(), loadSubscriptionStore()]);
      if (!mounted) return;
      setSubscription(getLocalSubscription());
      setTrial(getTrialState());
      // Check if trial notification was already shown this trial period
      const notifShown = await AsyncStorage.getItem(TRIAL_NOTIF_KEY);
      if (mounted) setTrialNotificationShown(notifShown === 'true');
    })();
    const unsubSub = subscribeToSubscriptionStore(setSubscription);
    const unsubTrial = subscribeTrial(setTrial);
    return () => {
      mounted = false;
      unsubSub();
      unsubTrial();
    };
  }, []);

  const refresh = useCallback(async () => {
    const [local, trialState] = await Promise.all([getLocalSubscription(), getTrialState()]);
    setSubscription(local);
    setTrial(trialState);
    if (currentUserId) {
      await syncSubscriptionFromSupabase(currentUserId).catch(err =>
        console.warn('[SubscriptionContext] Supabase sync failed:', err)
      );
    }
  }, [currentUserId]);

  const markTrialNotificationShown = useCallback(async () => {
    setTrialNotificationShown(true);
    await AsyncStorage.setItem(TRIAL_NOTIF_KEY, 'true');
  }, []);

  const trialActive = trial.status === 'active';

  // Check if subscription exists and is not expired
  const now = Date.now();
  const hasActiveSeekerSub =
    subscription &&
    subscription.userType === 'seeker' &&
    subscription.status === 'active' &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt).getTime() > now;

  const isSubscribed = !!hasActiveSeekerSub;

  const subscriptionExpired =
    !!subscription &&
    subscription.userType === 'seeker' &&
    subscription.status === 'active' &&
    !!subscription.expiresAt &&
    new Date(subscription.expiresAt).getTime() <= now;

  const trialEnded = trial.status === 'expired' && !isSubscribed;

  // Master gate: seeker is locked when trial is over AND no paid subscription
  const isSeekerLocked = !trialActive && !isSubscribed;

  const isEntitled = useCallback(
    (role: UserType, tier: SubscriptionTier): boolean => {
      if (tier === 'Free') return true;
      const sub = subscription && subscription.userType === role ? subscription : null;
      if (sub) {
        return TIER_RANK[sub.tier] >= TIER_RANK[tier];
      }
      // Seeker trial unlocks Premium features for the seeker role
      if (role === 'seeker' && trialActive && TIER_RANK['Premium'] >= TIER_RANK[tier]) {
        return true;
      }
      return false;
    },
    [subscription, trialActive]
  );

  const effectiveTier = useCallback(
    (role: UserType): SubscriptionTier => {
      const sub = subscription && subscription.userType === role ? subscription : null;
      if (sub) return sub.tier;
      if (role === 'seeker' && trialActive) return 'Premium';
      return 'Free';
    },
    [subscription, trialActive]
  );

  const value = useMemo(
    () => ({
      subscription,
      trial,
      trialActive,
      trialEnded,
      isSubscribed,
      isSeekerLocked,
      subscriptionExpired,
      trialNotificationShown,
      markTrialNotificationShown,
      isEntitled,
      effectiveTier,
      refresh,
    }),
    [subscription, trial, trialActive, trialEnded, isSubscribed, isSeekerLocked, subscriptionExpired, trialNotificationShown, markTrialNotificationShown, isEntitled, effectiveTier, refresh]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions(): PlanEntitlement {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return ctx;
}
