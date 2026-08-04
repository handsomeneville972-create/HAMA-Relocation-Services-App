/**
 * HAMA Subscription Plans — single source of truth
 *
 * Every pricing surface in the app reads from this module: Subscriptions,
 * My Plan (workspace activation), provider onboarding, seller upsell,
 * landlord dashboard, and admin views. NEVER hardcode plan prices elsewhere.
 *
 * Pricing (KSh/month): all paid plans reduced by KSh 100.
 */

import type { SubscriptionPlan, UserType, SubscriptionTier } from './types';

// ============ PAID PLANS ============

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // House Seekers
  { id: 'sub1', userType: 'seeker', tier: 'Free', price: 0, currency: 'KSh', features: ['Basic search', 'Save up to 20 properties', 'Standard recommendations'] },
  { id: 'sub2', userType: 'seeker', tier: 'Premium', price: 199, currency: 'KSh', features: ['Unlimited saves', 'AI recommendations', 'Advanced filters', 'Student housing tools', 'Priority notifications'], highlighted: true },
  { id: 'sub3', userType: 'seeker', tier: 'Pro', price: 599, currency: 'KSh', features: ['Premium listings first', 'Advanced neighborhood reports', 'Relocation discounts', 'Priority support', 'Exclusive deals'] },
  // Landlords
  { id: 'sub4', userType: 'landlord', tier: 'Basic', price: 899, currency: 'KSh', features: ['10 active listings'] },
  { id: 'sub5', userType: 'landlord', tier: 'Premium', price: 2899, currency: 'KSh', features: ['50 listings', 'Featured properties'], highlighted: true },
  { id: 'sub6', userType: 'landlord', tier: 'Pro', price: 6899, currency: 'KSh', features: ['Unlimited listings', 'Analytics dashboard', 'Priority placement', 'Marketing tools'] },
  // Sellers
  { id: 'sub7', userType: 'seller', tier: 'Basic', price: 399, currency: 'KSh', features: ['25 products'] },
  { id: 'sub8', userType: 'seller', tier: 'Premium', price: 1899, currency: 'KSh', features: ['250 products', 'Featured store'], highlighted: true },
  { id: 'sub9', userType: 'seller', tier: 'Pro', price: 4899, currency: 'KSh', features: ['Unlimited products', 'Store analytics', 'Homepage promotion'] },
  // Service Providers
  { id: 'sub10', userType: 'service_provider', tier: 'Basic', price: 399, currency: 'KSh', features: ['List your services'] },
  { id: 'sub11', userType: 'service_provider', tier: 'Premium', price: 1399, currency: 'KSh', features: ['Priority ranking', 'Lead generation', 'Verified badge'], highlighted: true },
  { id: 'sub12', userType: 'service_provider', tier: 'Pro', price: 3899, currency: 'KSh', features: ['Top ranking', 'Premium leads', 'Verified badge', 'Analytics'] },
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

/** The seeker Free plan — during/after trial it exposes Premium features */
export function getSeekerTrialPlan(): SubscriptionPlan {
  return {
    ...getPlan('seeker', 'Free')!,
    tier: 'Free',
    features: getPlan('seeker', 'Premium')!.features,
  };
}

// ============ SERVICE PROVIDER PLANS ============
// Canonical svc-provider scale: Basic / Premium / Pro (see above).
// These mirror Basic + Premium for onboarding / upsell flows.
// Shape kept compatible with the legacy provider stack (boost, period).

export interface ProviderPlanInfo {
  price: number;
  period: string;
  features: string[];
  boost: number;
}

export const PROVIDER_PLANS: Record<'Basic' | 'Premium', ProviderPlanInfo> = {
  Basic: {
    price: getPlan('service_provider', 'Basic')!.price,
    period: '/month',
    boost: 0.6,
    features: [
      'Public business profile',
      'Search ranking boost',
      'Up to 10 services',
      'Quotation management',
      'Portfolio gallery',
    ],
  },
  Premium: {
    price: getPlan('service_provider', 'Premium')!.price,
    period: '/month',
    boost: 1,
    features: [
      'Everything in Basic',
      'Top-of-search priority',
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
  house_seeker: { name: 'Free', tier: 'Free', price: 0, interval: 'free' },
  landlord: { name: 'Premium', tier: 'Premium', price: getPlan('landlord', 'Premium')!.price, interval: 'monthly' },
  seller: { name: 'Pro', tier: 'Pro', price: getPlan('seller', 'Pro')!.price, interval: 'monthly' },
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
