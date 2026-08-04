/**
 * HAMA Feature Request Service
 *
 * Persists feature requests (local AsyncStorage) for the founder/admin
 * dashboards. Used to rank and track what users want next.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeatureRequest, FeatureRequestPriority, FeatureRequestCategory } from '../constants/types';

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
