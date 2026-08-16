/**
 * HAMA Subscription Plans — single source of truth
 *
 * Every pricing surface in the app reads from this module: Subscriptions,
 * My Plan (workspace activation), provider onboarding, seller upsell,
 * landlord dashboard, and admin views. NEVER hardcode plan prices elsewhere.
 *
 * Pricing (KSh/month):
 *   seeker           Premium 199 (single plan)
 *   landlord         Basic 899 / Premium 2899 / Pro 6899 (3 free uploads)
 *   seller           Free 5 products / Basic 399 (up to 20) / Premium 599 (unlimited)
 *   service_provider Premium 299 (single plan)
 */

import type { SubscriptionPlan, UserType, SubscriptionTier } from './types';

// ============ PAID PLANS ============

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // House Seekers — single plan
  { id: 'sub2', userType: 'seeker', tier: 'Premium', price: 199, currency: 'KSh', features: ['Featured properties access', 'Featured products access', 'Full marketplace shopping', 'Best house deal notifications', 'Community access & feed', 'Unlimited saves', 'AI recommendations', 'Advanced filters'], highlighted: true },
  // Landlords
  { id: 'sub4', userType: 'landlord', tier: 'Basic', price: 899, currency: 'KSh', features: ['10 active listings'] },
  { id: 'sub5', userType: 'landlord', tier: 'Premium', price: 2899, currency: 'KSh', features: ['50 listings', 'Featured properties'], highlighted: true },
  { id: 'sub6', userType: 'landlord', tier: 'Pro', price: 6899, currency: 'KSh', features: ['Unlimited listings', 'Analytics dashboard', 'Priority placement', 'Marketing tools'] },
  // Sellers
  { id: 'sub7', userType: 'seller', tier: 'Free', price: 0, currency: 'KSh', features: ['5 free products'] },
  { id: 'sub8', userType: 'seller', tier: 'Basic', price: 399, currency: 'KSh', features: ['Up to 20 products'] },
  { id: 'sub9', userType: 'seller', tier: 'Premium', price: 599, currency: 'KSh', features: ['Unlimited products', 'Featured store'], highlighted: true },
  // Service Providers — single plan
  { id: 'sub10', userType: 'service_provider', tier: 'Premium', price: 299, currency: 'KSh', features: ['List your services', 'Priority ranking', 'Lead generation', 'Verified badge', 'Analytics'], highlighted: true },
];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  seeker: 'House Seeker',
  landlord: 'Landlord',
  seller: 'Seller',
  service_provider: 'Service Provider',
};

export function getPlansForRole(userType: UserType): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(p => p.userType === userType);
}

export function getPlan(userType: UserType, tier: SubscriptionTier): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.userType === userType && p.tier === tier);
}

// ============ 7-DAY FREE TRIAL (seekers) ============

export const SEEKER_TRIAL_DAYS = 7;

// ============ SERVICE PROVIDER PLANS ============
// Canonical svc-provider scale: a single Premium plan (KSh 299/month).
// Shape kept compatible with the legacy provider stack (boost, period).

export interface ProviderPlanInfo {
  price: number;
  period: string;
  features: string[];
  boost: number;
}

export const PROVIDER_PLANS: Record<'Premium', ProviderPlanInfo> = {
  Premium: {
    price: getPlan('service_provider', 'Premium')!.price,
    period: '/month',
    boost: 1,
    features: [
      'Public business profile',
      'Search ranking boost',
      'Up to 10 services',
      'Quotation management',
      'Portfolio gallery',
      'Verified badge',
      'Analytics dashboard',
      'Promotions & featured slots',
      'Priority support',
    ],
  },
};

// ============ WORKSPACE ACTIVATION PRICES (My Plan) ============
// Each workspace activates with its headlining tier from the canonical scale.

export const WORKSPACE_PLAN_PRICES: Record<
  string,
  { name: string; tier: SubscriptionTier; price: number; interval: 'free' | 'monthly' | 'yearly' }
> = {
  house_seeker: { name: 'Premium', tier: 'Premium', price: getPlan('seeker', 'Premium')!.price, interval: 'monthly' },
  landlord: { name: 'Premium', tier: 'Premium', price: getPlan('landlord', 'Premium')!.price, interval: 'monthly' },
  seller: { name: 'Premium', tier: 'Premium', price: getPlan('seller', 'Premium')!.price, interval: 'monthly' },
  service_provider: { name: 'Premium', tier: 'Premium', price: getPlan('service_provider', 'Premium')!.price, interval: 'monthly' },
};

// ============ ADMIN PRICING TABLE (SuperAdmin) ============

export interface AdminPricingRow {
  role: UserType;
  roleLabel: string;
  tier: SubscriptionTier;
  price: number;
}

export const ADMIN_PRICING_ROWS: AdminPricingRow[] = SUBSCRIPTION_PLANS.map(p => ({
  role: p.userType,
  roleLabel: USER_TYPE_LABELS[p.userType],
  tier: p.tier,
  price: p.price,
}));

// ============ PLAN TIER META ============

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  Free: '#8E8E93',
  Basic: '#0A84FF',
  Premium: '#FF6A00',
  Pro: '#BF5AF2',
};
