import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CustomerRecord,
  EngagementSeries,
  JobItem,
  ProfileCompletionBreakdown,
  ProviderPlanTier,
  ProviderProfile,
  ProviderStepValidation,
  QuoteRequest,
  RankedProvider,
  ServiceCategory,
  ServiceSubcategory,
  WalletTransaction,
} from '../constants/types';

const DRAFT_KEY = 'hama_provider_draft_v1';
const PROFILE_KEY = 'hama_provider_profile_v1';
const DEBOUNCE_MS = 350;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const PROVIDER_STEP_KEYS = [
  'basic',
  'service',
  'portfolio',
  'boost',
] as const;

export type ProviderStepKey = (typeof PROVIDER_STEP_KEYS)[number];

export const PROVIDER_STEP_LABELS: Record<ProviderStepKey, string> = {
  basic: 'Basic Information',
  service: 'Service Information',
  portfolio: 'Portfolio & Experience',
  boost: 'Ranking Boost (optional)',
};

export const CATEGORIES: { value: ServiceCategory; subcategories: ServiceSubcategory[] }[] = [
  { value: 'Relocation', subcategories: ['Hamisha Squad', 'Movers', 'Packers'] },
  {
    value: 'Home Maintenance',
    subcategories: ['Plumbers', 'Electricians', 'Painters', 'Carpenters', 'Handymen', 'Welders'],
  },
  {
    value: 'Cleaning',
    subcategories: ['House Cleaners', 'Deep Cleaning', 'Laundry Services', 'Pest Control'],
  },
  {
    value: 'Technology',
    subcategories: [
      'WiFi Installation',
      'CCTV Installers',
      'Smart Home Setup',
      'Internet Installers',
    ],
  },
  { value: 'Construction', subcategories: ['Contractors', 'Architects'] },
  { value: 'Home Improvement', subcategories: ['Interior Designers', 'Renovators'] },
  {
    value: 'Household',
    subcategories: ['Nannies', 'Gardeners', 'Security Guards'],
  },
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const EMPTY_PROFILE: ProviderProfile = {
  id: '',
  businessName: '',
  logo: '',
  coverImage: '',
  description: '',
  yearsInBusiness: 1,
  teamSize: 1,
  phone: '',
  email: '',
  website: '',
  socialMedia: [],
  address: '',
  county: '',
  town: '',
  gps: null,
  category: 'Home Maintenance',
  subcategory: 'Plumbers',
  workerType: 'Individual',
  pricingType: 'quote',
  startingPrice: 0,
  availability: true,
  services: [],
  serviceAreas: { counties: [], towns: [], neighborhoods: [], radiusKm: 10 },
  businessHours: DAYS.map((day) => ({
    day,
    open: '08:00',
    close: '18:00',
    closed: day === 'Sun',
  })),
  open247: false,
  callOutFee: 0,
  consultationFee: 0,
  packages: [],
  portfolio: [],
  certifications: [],
  documents: [],
  paymentMethods: ['M-Pesa'],
  mpesaNumber: '',
  bankAccount: null,
  branding: { accentColor: '#FF6A00', tagline: '', promoVideo: null },
  languages: ['English', 'Swahili'],
  isEmergencyProvider: false,
  warranty: '',
  team: [],
  reviews: [],
  faqs: [],
  promotions: [],
  status: 'draft',
  plan: 'Basic',
  subscriptionExpiry: null,
  completedSteps: [],
  keywords: [],
  searchScore: 0,
  onboardingComplete: false,
  responseTime: '~1 hour',
  rating: 0,
  reviewCount: 0,
  completedJobs: 0,
  totalRevenue: 0,
  walletBalance: 0,
  createdAt: '',
  updatedAt: '',
};

export function emptyProviderProfile(): ProviderProfile {
  return JSON.parse(JSON.stringify(EMPTY_PROFILE));
}

// ---------------- Draft persistence (autosave) ----------------

export async function loadDraft(): Promise<ProviderProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ProviderProfile) : null;
  } catch {
    return null;
  }
}

export async function saveDraft(profile: ProviderProfile): Promise<void> {
  try {
    const payload = { ...profile, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

export function autosave(profile: ProviderProfile): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDraft(profile);
  }, DEBOUNCE_MS);
}

export async function clearDraft(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export async function saveProfile(profile: ProviderProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export async function loadProfile(): Promise<ProviderProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as ProviderProfile) : null;
  } catch {
    return null;
  }
}

// ---------------- Supabase publication ----------------

import { supabase } from '../utils/supabaseClient';
import { uploadFile } from './uploadService';

export const PROVIDER_STORAGE = {
  avatars: 'provider-avatars',
  portfolio: 'provider-portfolio',
  certificates: 'provider-certificates',
} as const;

/**
 * Upload staged local media (logo, cover, portfolio photos, certificate
 * documents) to Supabase Storage. Returns a copy of the profile whose
 * media fields point at remote URLs. Local URIs are preserved for
 * documents so they still render offline.
 */
export async function uploadProviderMedia(
  profile: ProviderProfile,
  userId: string
): Promise<ProviderProfile> {
  const next = { ...profile };

  if (next.logo && !next.logo.startsWith('http')) {
    const res = await uploadFile(PROVIDER_STORAGE.avatars, userId, next.logo);
    if ('url' in res) next.logo = res.url;
  }
  if (next.coverImage && !next.coverImage.startsWith('http')) {
    const res = await uploadFile(PROVIDER_STORAGE.avatars, userId, next.coverImage);
    if ('url' in res) next.coverImage = res.url;
  }
  if (next.portfolio.length > 0) {
    next.portfolio = await Promise.all(
      next.portfolio.map(async (item) => {
        if (item.uri.startsWith('http')) return item;
        const res = await uploadFile(PROVIDER_STORAGE.portfolio, userId, item.uri);
        if ('url' in res) return { ...item, uri: res.url };
        return item;
      })
    );
  }
  if (next.documents.length > 0) {
    next.documents = await Promise.all(
      next.documents.map(async (doc) => {
        if (doc.remotePath) return doc;
        const res = await uploadFile(PROVIDER_STORAGE.certificates, userId, doc.uri);
        if ('url' in res) {
          return { ...doc, remotePath: res.fileName, uri: res.url };
        }
        return doc;
      })
    );
  }
  return next;
}

/**
 * Publish a provider profile to Supabase (instant publish — no approval
 * queue). Upserts into service_providers for the current user with the
 * full profile stored in the `profile` jsonb column and core columns
 * kept in sync for public listing queries. Duplicate phone numbers are
 * rejected. Failures return an error string; callers may fall back to
 * local-only profiles (offline-tolerant).
 */
export async function publishProviderProfile(
  profile: ProviderProfile,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const phone = normalizeKenyanPhone(profile.phone);
    if (phone) {
      const { data: dupes } = await supabase
        .from('service_providers')
        .select('id')
        .eq('phone', phone)
        .neq('user_id', userId)
        .limit(1);
      if (dupes && dupes.length > 0) {
        return {
          ok: false,
          error:
            'That phone number is already connected to another account. Use a different number or sign in to the existing account.',
        };
      }
    }

    const enriched = await uploadProviderMedia(profile, userId);
    const payload = {
      user_id: userId,
      name: enriched.businessName,
      logo_url: enriched.logo || null,
      banner_url: enriched.coverImage || null,
      description: enriched.description,
      category: enriched.category,
      subcategory: enriched.subcategory,
      location: [enriched.town, enriched.county].filter(Boolean).join(', ') || null,
      phone: phone || null,
      email: enriched.email || null,
      pricing: enriched.pricingType === 'fixed' && enriched.startingPrice > 0
        ? `From KSh ${enriched.startingPrice}`
        : 'quote',
      availability: enriched.availability ? 'available' : 'offline',
      status: 'active',
      profile: enriched,
    };

    const { data: existing } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('service_providers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from('service_providers').insert(payload);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Publication failed' };
  }
}

// ---------------- Kenyan phone helpers ----------------

export function normalizeKenyanPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (/^(07|01)\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `+254${digits}`;
  if (/^254(7|1)\d{8}$/.test(digits)) return `+${digits}`;
  return phone.trim();
}

export function isValidKenyanPhone(phone: string): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  return /^(07|01|2547|2541|7)\d{8}$/.test(digits);
}

// ---------------- Step validation ----------------

export function validateStep(
  step: ProviderStepKey,
  profile: ProviderProfile
): ProviderStepValidation {
  switch (step) {
    case 'basic':
      if (!profile.businessName.trim()) return { valid: false, message: 'Business name is required' };
      if (!profile.phone.trim() || !isValidKenyanPhone(profile.phone))
        return { valid: false, message: 'Enter a valid Kenyan mobile number, such as 0712 345 678.' };
      if (profile.description.trim().length < 30)
        return { valid: false, message: 'Description needs at least 30 characters' };
      return { valid: true };
    case 'service':
      if (!profile.category) return { valid: false, message: 'Pick a category' };
      if (!profile.subcategory) return { valid: false, message: 'Pick a subcategory' };
      if (profile.services.length === 0)
        return { valid: false, message: 'Add at least one service' };
      if (profile.services.some((s) => !s.name.trim() || s.price < 0))
        return { valid: false, message: 'Every service needs a name and valid price' };
      return { valid: true };
    case 'portfolio':
      return { valid: true, message: 'Recommended but optional' };
    case 'boost':
      return { valid: true, message: 'Recommended but optional' };
  }
}

// ---------------- Profile completeness ----------------

const SECTION_WEIGHTS: { key: ProviderStepKey; label: string }[] = [
  { key: 'basic', label: 'Basic Information' },
  { key: 'service', label: 'Services & Pricing' },
  { key: 'portfolio', label: 'Portfolio & Certificates' },
  { key: 'boost', label: 'Ranking Boost' },
];

export function completionScore(profile: ProviderProfile): ProfileCompletionBreakdown {
  const checks: Record<ProviderStepKey, [boolean, number]> = {
    basic: [
      !!(
        profile.businessName.trim() &&
        profile.phone.trim() &&
        profile.description.trim().length >= 30 &&
        profile.logo
      ),
      1,
    ],
    service: [!!(profile.category && profile.subcategory && profile.services.length >= 1 && profile.startingPrice > 0), 2],
    portfolio: [
      profile.portfolio.filter((p) => p.type === 'photo').length >= 3 || profile.certifications.length >= 1,
      2,
    ],
    boost: [
      !!(
        (profile.serviceAreas.counties.length > 0 || profile.serviceAreas.towns.length > 0) &&
        (profile.packages.length >= 1 || profile.mpesaNumber.trim() || profile.branding.tagline.trim())
      ),
      2,
    ],
  };
  let totalDone = 0;
  let totalPossible = 0;
  const sections = SECTION_WEIGHTS.map(({ key, label }) => {
    const [done, weight] = checks[key];
    totalDone += done ? weight : 0;
    totalPossible += weight;
    return { key, label, done: done ? weight : 0, total: weight };
  });
  return {
    total: Math.round((totalDone / totalPossible) * 100),
    sections,
  };
}

// ---------------- Profile strength (ranking-boost language) ----------------

export interface ProfileStrength {
  score: number;
  label: string;
  hints: string[];
}

export function profileStrength(profile: ProviderProfile): ProfileStrength {
  const hints: string[] = [];
  const score = completionScore(profile).total;

  if (!profile.logo) hints.push('Add a profile photo — profiles with a clear face photo get more requests.');
  if (!profile.startingPrice || profile.startingPrice <= 0) hints.push('Add a starting price so clients can decide faster.');
  if (profile.portfolio.filter((p) => p.type === 'photo').length < 3) hints.push('Add at least 3 work photos (max 5).');
  if (profile.certifications.length === 0) hints.push('Upload trade certificates for the biggest ranking boost.');
  if (profile.serviceAreas.counties.length === 0 && profile.serviceAreas.towns.length === 0)
    hints.push('Tell clients which areas you serve.');
  if (profile.packages.length === 0) hints.push('Create Bronze, Silver & Gold packages for premium clients.');
  if (!profile.mpesaNumber.trim()) hints.push('Add your M-Pesa number for fast payouts.');
  if (!profile.branding.tagline.trim()) hints.push('Add a short tagline to complete your storefront.');

  let label = 'Getting started';
  if (score >= 85) label = 'Excellent ranking potential';
  else if (score >= 65) label = 'Strong ranking potential';
  else if (score >= 40) label = 'Growing profile';

  return { score, label, hints };
}

// ---------------- Keyword generation ----------------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'our', 'we', 'to', 'of', 'in', 'on', 'at',
  'by', 'is', 'are', 'am', 'be', 'your', 'you', 'service', 'services', 'best', 'top',
  'professional', 'quality', 'home', 'house', 'apartment', 'works',
]);

export function generateKeywords(profile: ProviderProfile): string[] {
  const corpus: string[] = [
    profile.businessName,
    profile.description,
    profile.category,
    profile.subcategory,
    ...profile.services.map((s) => `${s.name} ${s.description}`),
    ...profile.portfolio.map((p) => p.title),
    ...profile.serviceAreas.towns,
    ...profile.serviceAreas.counties,
    ...profile.serviceAreas.neighborhoods,
    ...profile.packages.map((p) => p.name),
  ];
  const counts = new Map<string, number>();
  corpus
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([w]) => w);
}

// ---------------- Weighted search ranking engine ----------------

export interface SearchRankWeights {
  categoryRelevance: number;
  locationProximity: number;
  serviceMatching: number;
  ratings: number;
  reviewQuality: number;
  verification: number;
  profileCompleteness: number;
  responseTime: number;
  recentActivity: number;
  subscriptionBoost: number;
}

export const DEFAULT_RANK_WEIGHTS: SearchRankWeights = {
  categoryRelevance: 0.25,
  locationProximity: 0.2,
  serviceMatching: 0.2,
  ratings: 0.1,
  reviewQuality: 0.05,
  verification: 0.05,
  profileCompleteness: 0.05,
  responseTime: 0.05,
  recentActivity: 0.03,
  subscriptionBoost: 0.02,
};

export interface SearchRankOptions {
  query?: string;
  category?: ServiceCategory;
  subcategory?: ServiceSubcategory;
  location?: string;
  weights?: Partial<SearchRankWeights>;
}

function normalize(n: number, max: number): number {
  return max <= 0 ? 0 : Math.min(1, n / max);
}

export function rankProviders(
  profiles: ProviderProfile[],
  options: SearchRankOptions = {}
): RankedProvider[] {
  const weights = { ...DEFAULT_RANK_WEIGHTS, ...options.weights };
  const q = (options.query || '').toLowerCase().trim();
  const qTokens = q ? q.split(/\s+/).filter((t) => t.length > 1) : [];
  const maxReviews = Math.max(1, ...profiles.map((p) => p.reviewCount));
  const maxJobs = Math.max(1, ...profiles.map((p) => p.completedJobs));
  const now = Date.now();

  const scored = profiles.map((profile) => {
    const completeness = completionScore(profile).total / 100;

    const categoryRelevance = options.category
      ? profile.category === options.category
        ? 1
        : options.subcategory && profile.subcategory === options.subcategory
          ? 0.9
          : 0.3
      : options.subcategory && profile.subcategory === options.subcategory
        ? 0.9
        : 0.5;

    const locationProximity = options.location
      ? normalize(
          profile.serviceAreas.counties.includes(options.location) ||
            profile.serviceAreas.towns.includes(options.location) ||
            profile.serviceAreas.neighborhoods.includes(options.location)
            ? 1
            : profile.county === options.location
              ? 0.8
              : 0.2,
          1
        )
      : 0.5;

    const serviceMatching = qTokens.length
      ? (() => {
          const profileText = [
            profile.businessName,
            profile.description,
            profile.category,
            profile.subcategory,
            ...profile.services.map((s) => s.name),
            ...profile.keywords,
          ]
            .join(' ')
            .toLowerCase();
          const hits = qTokens.filter((t) => profileText.includes(t)).length;
          return hits / qTokens.length;
        })()
      : 0.7;

    const ratings = normalize(profile.reviewCount > 0 ? profile.rating : 0, 5);

    const reviewQuality = profile.reviewCount > 0 ? normalize(profile.reviewCount, maxReviews) : 0;
    const verification = profile.status === 'active' && profile.documents.some((d) => d.status === 'verified') ? 1 : profile.status === 'active' ? 0.5 : 0;
    const profileCompleteness = completeness;
    const responseTime = normalize(parseInt(profile.responseTime.replace(/\D/g, '') || '24', 10), 24);
    const recentActivity = profile.updatedAt
      ? Math.max(0, 1 - (now - new Date(profile.updatedAt).getTime()) / (30 * 86400000))
      : 0.2;
    const subscriptionBoost = profile.plan === 'Premium' ? 1 : profile.plan === 'Basic' ? 0.6 : 0.2;

    const score =
      weights.categoryRelevance * categoryRelevance +
      weights.locationProximity * locationProximity +
      weights.serviceMatching * serviceMatching +
      weights.ratings * ratings +
      weights.reviewQuality * reviewQuality +
      weights.verification * verification +
      weights.profileCompleteness * profileCompleteness +
      weights.responseTime * responseTime +
      weights.recentActivity * recentActivity +
      weights.subscriptionBoost * subscriptionBoost;

    return {
      profile,
      score,
      breakdown: {
        categoryRelevance,
        locationProximity,
        serviceMatching,
        ratings,
        reviewQuality,
        verification,
        profileCompleteness,
        responseTime,
        recentActivity,
        subscriptionBoost,
      },
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry, profile: { ...entry.profile, searchScore: Math.round(entry.score * 100) } }));
}

// ---------------- Plan pricing ----------------
// Canonical provider pricing lives in constants/plans.ts.

export { PROVIDER_PLANS } from '../constants/plans';

/**
 * Maps legacy plan values onto the canonical scale.
 * 'Standard' was the old name for the provider Basic tier.
 */
export function normalizeProviderPlan(plan: string | null | undefined): ProviderPlanTier {
  if (plan === 'Standard') return 'Basic';
  if (plan === 'Basic' || plan === 'Premium' || plan === 'House Seeker') return plan;
  return 'Basic';
}

export function getPlanBoost(plan: ProviderPlanTier): number {
  if (plan === 'Premium') return 1;
  if (plan === 'Basic') return 0.6;
  return 0.2;
}

// ---------------- Demo analytics generator (deterministic) ----------------

export function generateDashboardData(profile: ProviderProfile) {
  const seed = (profile.businessName.length * 13 + profile.id.length * 7) || 42;
  const rnd = (i: number) => ((seed * (i + 3) * 2654435761) % 10000) / 10000;

  const weeklyLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const weeklyRevenue = weeklyLabels.map((_, i) =>
    Math.round((profile.totalRevenue * 0.09 * (0.6 + rnd(i))) / 100) * 100
  );
  const weeklyBookings = weeklyLabels.map((_, i) =>
    Math.round(profile.completedJobs * 0.11 * (0.5 + rnd(i)))
  );
  const engagement: EngagementSeries[] = weeklyLabels.map((label, i) => ({
    label,
    profileViews: Math.round(40 + 60 * rnd(i) + profile.searchScore * 0.2),
    impressions: Math.round(120 + 200 * rnd(i) + profile.searchScore * 0.6),
    clicks: Math.round(10 + 25 * rnd(i)),
    calls: Math.round(2 + 6 * rnd(i)),
    chats: Math.round(3 + 8 * rnd(i)),
    whatsapp: Math.round(1 + 4 * rnd(i)),
  }));

  const names = ['Brian Otieno', 'Faith Wanjiru', 'Kevin Mwangi', 'Amina Hassan', 'Peter Kamau', 'Lucy Achieng'];
  const services = profile.services.length ? profile.services.map((s) => s.name) : ['Repairs', 'Installation'];

  const quotes: QuoteRequest[] = Array.from({ length: 6 }, (_, i) => ({
    id: `q-${i}`,
    customerName: names[i % names.length],
    avatar: `https://i.pravatar.cc/100?u=${seed + i}`,
    service: services[i % services.length],
    budget: (800 + Math.round(rnd(i) * 400) * 100),
    location: `${profile.town || 'Nairobi'}, ${profile.county || 'Nairobi'}`,
    status: (['new', 'new', 'quoted', 'accepted', 'declined'] as const)[i % 5],
    date: `2d ago`,
    notes: 'Customer requested an inspection before booking.',
  }));

  const jobs: JobItem[] = Array.from({ length: 6 }, (_, i) => ({
    id: `j-${i}`,
    customerName: names[(i + 2) % names.length],
    avatar: `https://i.pravatar.cc/100?u=${seed + i + 9}`,
    service: services[i % services.length],
    status: (['new', 'in_progress', 'completed'] as const)[i % 3],
    amount: 1000 + Math.round(rnd(i) * 300) * 100,
    date: ['Today', 'Yesterday', 'Mon', 'Mon', 'Sun', 'Fri'][i],
    location: `${profile.town || 'Nairobi'}`,
  }));

  const customers: CustomerRecord[] = Array.from({ length: 5 }, (_, i) => ({
    id: `c-${i}`,
    name: names[(i + 4) % names.length],
    avatar: `https://i.pravatar.cc/100?u=${seed + i + 21}`,
    phone: `+254 7${String(11 + i)} ${String(200 + i * 137)} ${String(300 + i * 91)}`,
    totalSpent: (2000 + Math.round(rnd(i) * 800) * 100),
    bookings: 1 + Math.round(rnd(i) * 5),
    lastService: services[i % services.length],
    lastVisit: `${i + 1} week${i ? 's' : ''} ago`,
  }));

  const transactions: WalletTransaction[] = Array.from({ length: 5 }, (_, i) => ({
    id: `t-${i}`,
    type: i % 4 === 0 ? 'payout' : i % 4 === 1 ? 'fee' : 'payment',
    amount:
      i % 4 === 0 ? -(5000 + Math.round(rnd(i) * 400) * 100) : 1500 + Math.round(rnd(i) * 250) * 100,
    description:
      i % 4 === 0
        ? 'Withdrawal to M-Pesa'
        : i % 4 === 1
          ? 'Platform service fee'
          : `Payment — ${services[i % services.length]}`,
    date: ['Today', 'Yesterday', '2 days ago', '3 days ago', 'Last week'][i],
  }));

  const reviews = profile.reviews.length
    ? profile.reviews
    : Array.from({ length: 4 }, (_, i) => ({
        id: `r-${i}`,
        customerName: names[(i + 1) % names.length],
        avatar: `https://i.pravatar.cc/100?u=${seed + i + 33}`,
        rating: 5 - (i % 2),
        text: [
          'Very professional and tidy. Finished ahead of schedule and cleaned up after.',
          'Fair pricing and clear communication from start to finish.',
          'Showed up on time with all the right tools. Will definitely rebook.',
          'Great quality workmanship, especially the finishing touches.',
        ][i],
        date: ['2 days ago', '1 week ago', '2 weeks ago', '1 month ago'][i],
        service: services[i % services.length],
      }));

  return {
    weeklyLabels,
    weeklyRevenue,
    weeklyBookings,
    engagement,
    quotes,
    jobs,
    customers,
    transactions,
    reviews,
  };
}
