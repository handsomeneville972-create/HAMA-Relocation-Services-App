/**
 * HAMA™ Early Access Service
 *
 * Manages local storage persistence for:
 * - Priority Subscriber Waitlist entries
 * - Referral tracking data
 * - Email newsletter subscriptions
 *
 * In production, these would be stored in Supabase or a similar backend.
 * Currently uses AsyncStorage for persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WaitlistEntry, WaitlistIntent, PreferredPlan, EmailSubscription, FeatureRequest, FeatureRequestPriority, FeatureRequestCategory } from '../constants/types';

// ============================================================
// Storage Keys
// ============================================================

const WAITLIST_KEY = '@hama/waitlist_entries';
const EMAIL_SUBS_KEY = '@hama/email_subscriptions';

// ============================================================
// Waitlist Service
// ============================================================

export const waitlistService = {
  /** Get all waitlist entries */
  getAll: async (): Promise<WaitlistEntry[]> => {
    try {
      const data = await AsyncStorage.getItem(WAITLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /** Add a new waitlist entry */
  add: async (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'intent'>): Promise<WaitlistEntry> => {
    const entries = await waitlistService.getAll();

    // Determine intent level based on plan selection
    let intent: WaitlistIntent = 'low';
    if (entry.preferredPlan === 'Pro' || entry.preferredPlan === 'Enterprise') {
      intent = 'high';
    } else if (entry.preferredPlan === 'Premium') {
      intent = 'medium';
    }

    const newEntry: WaitlistEntry = {
      ...entry,
      id: 'wl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      intent,
      createdAt: new Date().toISOString(),
    };

    entries.push(newEntry);
    await AsyncStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
    return newEntry;
  },

  /** Get waitlist count */
  getCount: async (): Promise<number> => {
    const entries = await waitlistService.getAll();
    return entries.length;
  },

  /** Get entries by intent level */
  getByIntent: async (intent: WaitlistIntent): Promise<WaitlistEntry[]> => {
    const entries = await waitlistService.getAll();
    return entries.filter(e => e.intent === intent);
  },
};

// ============================================================
// Email Capture Service
// ============================================================

export const emailCaptureService = {
  /** Get all email subscriptions */
  getAll: async (): Promise<EmailSubscription[]> => {
    try {
      const data = await AsyncStorage.getItem(EMAIL_SUBS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /** Subscribe an email */
  subscribe: async (email: string, name?: string, userId?: string): Promise<EmailSubscription> => {
    const subs = await emailCaptureService.getAll();

    // Check if already subscribed
    const existing = subs.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const sub: EmailSubscription = {
      id: 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      email,
      name,
      userId,
      subscribedAt: new Date().toISOString(),
    };

    subs.push(sub);
    await AsyncStorage.setItem(EMAIL_SUBS_KEY, JSON.stringify(subs));
    return sub;
  },

  /** Get subscription count */
  getCount: async (): Promise<number> => {
    const subs = await emailCaptureService.getAll();
    return subs.length;
  },

  /** Unsubscribe */
  unsubscribe: async (email: string): Promise<void> => {
    const subs = await emailCaptureService.getAll();
    const filtered = subs.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    await AsyncStorage.setItem(EMAIL_SUBS_KEY, JSON.stringify(filtered));
  },
};

// ============================================================
// Feature Request Service
// ============================================================

const FEATURE_REQUESTS_KEY = '@hama/feature_requests';

function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const featureRequestService = {
  /** Get all feature requests */
  getAll: async (): Promise<FeatureRequest[]> => {
    try {
      const data = await AsyncStorage.getItem(FEATURE_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /** Add a new feature request */
  add: async (req: {
    title: string;
    description: string;
    priority: FeatureRequestPriority;
    category: FeatureRequestCategory;
    userId?: string;
    userName?: string;
    userEmail?: string;
  }): Promise<FeatureRequest> => {
    const requests = await featureRequestService.getAll();

    const newRequest: FeatureRequest = {
      ...req,
      id: generateId('fr'),
      votes: 1,
      voterIds: req.userId ? [req.userId] : [],
      status: 'planned',
      createdAt: new Date().toISOString(),
    };

    requests.push(newRequest);
    await AsyncStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  },

  /** Vote for a feature request */
  vote: async (requestId: string, userId: string): Promise<FeatureRequest | null> => {
    const requests = await featureRequestService.getAll();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return null;

    const req = requests[idx];
    if (req.voterIds.includes(userId)) {
      // Remove vote
      req.votes = Math.max(0, req.votes - 1);
      req.voterIds = req.voterIds.filter(id => id !== userId);
    } else {
      // Add vote
      req.votes += 1;
      req.voterIds.push(userId);
    }
    req.updatedAt = new Date().toISOString();

    requests[idx] = req;
    await AsyncStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(requests));
    return req;
  },

  /** Get requests sorted by votes (most popular first) */
  getByPopularity: async (): Promise<FeatureRequest[]> => {
    const requests = await featureRequestService.getAll();
    return requests.sort((a, b) => b.votes - a.votes);
  },

  /** Get requests filtered by category */
  getByCategory: async (category: FeatureRequestCategory): Promise<FeatureRequest[]> => {
    const requests = await featureRequestService.getAll();
    return requests.filter(r => r.category === category);
  },

  /** Get requests filtered by status */
  getByStatus: async (status: FeatureRequest['status']): Promise<FeatureRequest[]> => {
    const requests = await featureRequestService.getAll();
    return requests.filter(r => r.status === status);
  },

  /** Update request status (admin use) */
  updateStatus: async (requestId: string, status: FeatureRequest['status'], adminNotes?: string): Promise<FeatureRequest | null> => {
    const requests = await featureRequestService.getAll();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return null;

    requests[idx].status = status;
    if (adminNotes !== undefined) requests[idx].adminNotes = adminNotes;
    requests[idx].updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(requests));
    return requests[idx];
  },

  /** Get total count */
  getCount: async (): Promise<number> => {
    const requests = await featureRequestService.getAll();
    return requests.length;
  },
};
