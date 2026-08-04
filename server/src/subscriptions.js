/**
 * HAMA Subscription Service (server-side)
 *
 * Detects successful payments and stores/updates the user's subscription
 * in Supabase. The app then reads this record to enforce entitlements.
 *
 * Lookup flow:
 *   M-Pesa callback success → activateSubscription({ userId, tier, userType })
 *   1. Resolve the plan id from subscription_plans (user_type + tier)
 *   2. Expire any existing active subscription for the user
 *   3. Insert a new active subscription (30-day period)
 */

const supabaseModule = require('./supabase');

/** Lazy access so tests can swap the admin client between cases */
function getSupabase() {
  return supabaseModule.supabase;
}

const SUBSCRIPTION_PERIOD_DAYS = 30;

/**
 * Resolve the plan id for a tier + user type.
 * Returns the deterministic seed id when present, otherwise queries the DB.
 */
async function findPlanId({ tier, userType }) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('user_type', userType)
    .eq('tier', tier)
    .maybeSingle();

  if (error) {
    console.error('[Subscriptions] findPlanId error:', error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Activate a subscription for a user after a successful payment.
 * Expires previous active subscriptions, then inserts the new one.
 */
async function activateSubscription({ userId, tier, userType }) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[Subscriptions] Supabase not configured — skipping activation', { userId, tier, userType });
    return { success: false, error: 'Supabase not configured' };
  }

  if (!userId) {
    return { success: false, error: 'userId is required' };
  }

  const planId = await findPlanId({ tier, userType });
  if (!planId) {
    console.error('[Subscriptions] Plan not found for', { tier, userType });
    return { success: false, error: `Plan not found: ${userType} / ${tier}` };
  }

  // Expire any existing active subscriptions
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'expired',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Insert the new active subscription
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Subscriptions] activateSubscription error:', error.message);
    return { success: false, error: error.message };
  }

  console.log(`[Subscriptions] Activated ${tier} (${userType}) for ${userId} until ${expiresAt.toISOString()}`);
  return { success: true, subscription: data };
}

/**
 * Get the user's currently active subscription (joined with plan).
 */
async function getActiveSubscription(userId) {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase not configured', subscription: null };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*, plan:plan_id(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Subscriptions] getActiveSubscription error:', error.message);
    return { success: false, error: error.message, subscription: null };
  }

  // Treat expired subscriptions as inactive
  if (data && data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { success: true, subscription: null, expired: true };
  }

  return { success: true, subscription: data ?? null };
}

module.exports = {
  activateSubscription,
  getActiveSubscription,
  findPlanId,
  SUBSCRIPTION_PERIOD_DAYS,
};
