/**
 * Unit tests for server/src/subscriptions.js
 *
 * Tests cover:
 *   - findPlanId() — plan lookup, missing plan
 *   - activateSubscription() — success, missing userId, plan not found,
 *     previous subscriptions expired before insert
 *   - getActiveSubscription() — active record, expired record
 *
 * Supabase admin client is mocked via jest.
 */

jest.mock('../src/supabase', () => ({ supabase: null }));

// Build a fake supabase client chain that records calls
function createFakeSupabase(overrides = {}) {
  const calls = [];
  const query = () => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => overrides.maybeSingle ? overrides.maybeSingle(calls) : { data: null, error: null },
      insert: () => chain,
      update: () => chain,
      single: async () => overrides.single ? overrides.single(calls) : { data: null, error: null },
      then: undefined,
    };
    chain.select = () => {
      calls.push('select');
      return chain;
    };
    chain.eq = () => {
      calls.push('eq');
      return chain;
    };
    chain.order = () => {
      calls.push('order');
      return chain;
    };
    chain.limit = () => {
      calls.push('limit');
      return chain;
    };
    chain.insert = () => {
      calls.push('insert');
      return chain;
    };
    chain.update = () => {
      calls.push('update');
      return chain;
    };
    chain.maybeSingle = async () => (overrides.maybeSingle ? overrides.maybeSingle(calls) : { data: null, error: null });
    chain.single = async () => (overrides.single ? overrides.single(calls) : { data: null, error: null });
    return chain;
  };

  return {
    calls,
    from: () => query(),
  };
}

describe('subscriptions module', () => {
  let subscriptions;

  beforeEach(() => {
    jest.resetModules();
    subscriptions = require('../src/subscriptions');
  });

  describe('findPlanId()', () => {
    test('returns plan id from the DB', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({ data: { id: 'plan-123' }, error: null }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const id = await subscriptions.findPlanId({ tier: 'Premium', userType: 'seeker' });
      expect(id).toBe('plan-123');
    });

    test('returns null when plan is not found', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({ data: null, error: null }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const id = await subscriptions.findPlanId({ tier: 'Premium', userType: 'seeker' });
      expect(id).toBeNull();
    });
  });

  describe('activateSubscription()', () => {
    test('fails gracefully when supabase is not configured', async () => {
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = null;

      const result = await subscriptions.activateSubscription({ userId: 'u1', tier: 'Premium', userType: 'seeker' });
      expect(result.success).toBe(false);
    });

    test('fails when userId is missing', async () => {
      const supabase = createFakeSupabase();
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.activateSubscription({ tier: 'Premium', userType: 'seeker' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('userId');
    });

    test('fails when plan not found', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({ data: null, error: null }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.activateSubscription({ userId: 'u1', tier: 'Premium', userType: 'seeker' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Plan not found');
    });

    test('expires previous subscriptions and inserts a new active one', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({ data: { id: 'plan-123' }, error: null }),
        single: async (calls) => ({ data: { id: 'sub-1' }, error: null }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.activateSubscription({ userId: 'u1', tier: 'Premium', userType: 'seeker' });
      expect(result.success).toBe(true);
      expect(supabase.calls).toContain('update'); // expire old
      expect(supabase.calls).toContain('insert'); // insert new
    });
  });

  describe('getActiveSubscription()', () => {
    test('returns null when no active subscription', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({ data: null, error: null }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.getActiveSubscription('u1');
      expect(result.success).toBe(true);
      expect(result.subscription).toBeNull();
    });

    test('flags expired subscriptions as inactive', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({
          data: { id: 'sub-1', expires_at: '2020-01-01T00:00:00.000Z' },
          error: null,
        }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.getActiveSubscription('u1');
      expect(result.subscription).toBeNull();
      expect(result.expired).toBe(true);
    });

    test('returns the active subscription', async () => {
      const supabase = createFakeSupabase({
        maybeSingle: async () => ({
          data: { id: 'sub-1', expires_at: new Date(Date.now() + 86400000).toISOString() },
          error: null,
        }),
      });
      const supabaseModule = require('../src/supabase');
      supabaseModule.supabase = supabase;

      const result = await subscriptions.getActiveSubscription('u1');
      expect(result.subscription.id).toBe('sub-1');
    });
  });
});
