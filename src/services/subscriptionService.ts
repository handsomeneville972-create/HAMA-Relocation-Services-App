/**
 * HAMA Subscription Service
 *
 * Queries subscription plans and user subscriptions from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_SUBSCRIPTION_PLANS } from '../constants/data';
import { recordSubscription, clearLocalSubscription, type LocalSubscription } from '../utils/subscriptionStore';
import type { SubscriptionPlan, UserType } from '../constants/types';

export async function getSubscriptionPlans(
  userType?: UserType,
): Promise<{ data: SubscriptionPlan[] | null; error: string | null }> {
  return executeQuery<SubscriptionPlan[]>(
    async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (userType) {
        query = query.eq('user_type', userType);
      }

      const { data, error } = await query;
      return { data: data as SubscriptionPlan[] | null, error };
    },
    userType
      ? MOCK_SUBSCRIPTION_PLANS.filter(p => p.userType === userType)
      : MOCK_SUBSCRIPTION_PLANS,
  );
}

export async function getUserSubscription(
  userId: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      return { data, error };
    },
    null,
  );
}

export async function purchaseSubscription(params: {
  userId: string;
  planId: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', params.planId)
        .single();

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: params.userId,
          plan_id: params.planId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: plan
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select()
        .single();

      // Mirror locally so entitlement is instant
      if (!error && plan) {
        await recordSubscription({
          planId: params.planId,
          tier: plan.tier,
          userType: plan.user_type,
          price: Number(plan.price),
          status: 'active',
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      return { data, error };
    },
    null,
  );
}

/**
 * Reconcile the local mirror against the authoritative Supabase record.
 * Call after payment success / app start (authed users).
 */
export async function syncSubscriptionFromSupabase(userId: string): Promise<void> {
  if (!userId) return;
  const { data, error } = await executeQuery(
    async () => {
      const res = await supabase
        .from('user_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return { data: res.data, error: res.error };
    },
    null,
  );
  if (error || !data) {
    await clearLocalSubscription();
    return;
  }
  const expiresAt = data.expires_at as string | null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    await clearLocalSubscription();
    return;
  }
  await recordSubscription({
    planId: data.plan_id,
    tier: data.plan?.tier ?? 'Free',
    userType: data.plan?.user_type ?? 'seeker',
    price: Number(data.plan?.price ?? 0),
    status: 'active',
    startedAt: data.started_at ?? new Date().toISOString(),
    expiresAt,
  });
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscriptionId);
      return { data: null, error };
    },
    null,
  );
}
