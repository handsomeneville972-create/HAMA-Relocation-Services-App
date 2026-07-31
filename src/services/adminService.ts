/**
 * HAMA™ Super Admin Service
 *
 * Manages admin operations: user management, support tickets, audit logs,
 * feature flags, announcements, and platform health monitoring.
 *
 * In production, these would use Supabase with RLS restricted to admin roles.
 * Currently uses AsyncStorage for local persistence with mock data fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
  AdminAction,
  Announcement,
  FeatureFlags,
  PlatformHealth,
  AuditLogEntry,
} from '../constants/types';
import { MOCK_USERS } from '../constants/data';

// ============================================================
// Storage Keys
// ============================================================

const SUPPORT_TICKETS_KEY = '@hama/admin/support_tickets';
const ADMIN_ACTIONS_KEY = '@hama/admin/actions';
const ANNOUNCEMENTS_KEY = '@hama/admin/announcements';
const FEATURE_FLAGS_KEY = '@hama/admin/feature_flags';

// ============================================================
// Feature Flags — extend SYSTEM_SETTINGS for runtime control
// ============================================================

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiAssistant: true,
  marketplace: true,
  analytics: true,
  inventory: true,
  crm: true,
  referralSystem: true,
  waitlist: true,
  betaFeatures: true,
  earlyAccessMode: true,
  subscriptionsEnabled: false,
  paymentsEnabled: false,
};

export const adminFeatureFlagService = {
  /** Get all feature flags */
  getAll: async (): Promise<FeatureFlags> => {
    try {
      const data = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      return data ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(data) } : DEFAULT_FEATURE_FLAGS;
    } catch {
      return DEFAULT_FEATURE_FLAGS;
    }
  },

  /** Update a specific flag */
  update: async (updates: Partial<FeatureFlags>): Promise<FeatureFlags> => {
    const current = await adminFeatureFlagService.getAll();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(updated));
    return updated;
  },

  /** Reset to defaults */
  reset: async (): Promise<FeatureFlags> => {
    await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(DEFAULT_FEATURE_FLAGS));
    return DEFAULT_FEATURE_FLAGS;
  },
};

// ============================================================
// User Management
// ============================================================

export const adminUserService = {
  /** Get all users (mock data — in prod from Supabase) */
  getAll: async (): Promise<User[]> => {
    return MOCK_USERS;
  },

  /** Search users by query */
  search: async (query: string): Promise<User[]> => {
    const users = await adminUserService.getAll();
    const q = query.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q))
    );
  },

  /** Filter users by criteria */
  filter: async (criteria: {
    role?: string;
    verified?: boolean;
    active?: boolean;
  }): Promise<User[]> => {
    let users = await adminUserService.getAll();
    if (criteria.role) users = users.filter(u => u.role === criteria.role);
    if (criteria.verified !== undefined) users = users.filter(u => u.verified === criteria.verified);
    return users;
  },

  /** Get user by ID */
  getById: async (userId: string): Promise<User | null> => {
    const users = await adminUserService.getAll();
    return users.find(u => u.id === userId) ?? null;
  },

  /** Record an admin action */
  recordAction: async (action: Omit<AdminAction, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const existing = await adminActionService.getAll();
      const entry: AdminAction = {
        ...action,
        id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
        createdAt: new Date().toISOString(),
      };
      existing.unshift(entry);
      await AsyncStorage.setItem(ADMIN_ACTIONS_KEY, JSON.stringify(existing));
    } catch {
      // Silent fail
    }
  },
};

// ============================================================
// Support Tickets
// ============================================================

const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  { id: 't1', userId: 'u1', userName: 'James Mwangi', userEmail: 'james@example.com', category: 'technical', status: 'open', subject: 'Unable to upload property images', description: 'Getting an error when trying to upload photos for my new listing.', createdAt: '2024-06-20T10:00:00Z' },
  { id: 't2', userId: 'u2', userName: 'Sarah Akinyi', userEmail: 'sarah@example.com', category: 'feature_request', status: 'in_progress', subject: 'Need bulk product import', description: 'As a seller, I need to import 200+ products from a CSV file.', assignedTo: 'Neo', createdAt: '2024-06-19T14:30:00Z' },
  { id: 't3', userId: 'u3', userName: 'Peter Kamau', userEmail: 'peter@example.com', category: 'billing', status: 'open', subject: 'Commission calculation question', description: 'Can you clarify how the 5% commission is calculated on sales?', createdAt: '2024-06-18T09:15:00Z' },
  { id: 't4', userId: 'u4', userName: 'Grace Wanjiku', userEmail: 'grace@example.com', category: 'bug_report', status: 'resolved', subject: 'Search not returning correct results', description: 'When I search for 2-bedroom apartments in Kilimani, I get results for other areas.', assignedTo: 'Neo', createdAt: '2024-06-17T16:00:00Z', updatedAt: '2024-06-18T11:00:00Z', resolvedAt: '2024-06-18T11:00:00Z' },
  { id: 't5', userId: 'u1', userName: 'James Mwangi', userEmail: 'james@example.com', category: 'general', status: 'closed', subject: 'How do I become a verified seller?', description: 'What documents do I need to submit for seller verification?', createdAt: '2024-06-15T08:00:00Z', updatedAt: '2024-06-16T10:00:00Z', resolvedAt: '2024-06-16T10:00:00Z' },
];

export const adminSupportService = {
  /** Get all support tickets */
  getAll: async (): Promise<SupportTicket[]> => {
    try {
      const data = await AsyncStorage.getItem(SUPPORT_TICKETS_KEY);
      return data ? JSON.parse(data) : MOCK_SUPPORT_TICKETS;
    } catch {
      return MOCK_SUPPORT_TICKETS;
    }
  },

  /** Get tickets filtered by status */
  getByStatus: async (status: SupportTicketStatus): Promise<SupportTicket[]> => {
    const tickets = await adminSupportService.getAll();
    return tickets.filter(t => t.status === status);
  },

  /** Get tickets filtered by category */
  getByCategory: async (category: SupportTicketCategory): Promise<SupportTicket[]> => {
    const tickets = await adminSupportService.getAll();
    return tickets.filter(t => t.category === category);
  },

  /** Update ticket status */
  updateStatus: async (ticketId: string, status: SupportTicketStatus, assignedTo?: string): Promise<SupportTicket | null> => {
    const tickets = await adminSupportService.getAll();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return null;

    tickets[idx].status = status;
    tickets[idx].updatedAt = new Date().toISOString();
    if (status === 'resolved') tickets[idx].resolvedAt = new Date().toISOString();
    if (assignedTo) tickets[idx].assignedTo = assignedTo;

    await AsyncStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(tickets));
    return tickets[idx];
  },

  /** Get open ticket count */
  getOpenCount: async (): Promise<number> => {
    const tickets = await adminSupportService.getAll();
    return tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  },
};

// ============================================================
// Admin Actions / Audit Log
// ============================================================

export const adminActionService = {
  /** Get all admin actions */
  getAll: async (): Promise<AdminAction[]> => {
    try {
      const data = await AsyncStorage.getItem(ADMIN_ACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /** Record an admin action */
  record: async (action: Omit<AdminAction, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const existing = await adminActionService.getAll();
      const entry: AdminAction = {
        ...action,
        id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
        createdAt: new Date().toISOString(),
      };
      existing.unshift(entry);
      await AsyncStorage.setItem(ADMIN_ACTIONS_KEY, JSON.stringify(existing));
    } catch {
      // Silent fail
    }
  },
};

// ============================================================
// Announcements
// ============================================================

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Performance Improvements & Bug Fixes', excerpt: 'Optimized dashboard loading times by 40%', category: 'updates', targetAudience: 'all', published: true, createdAt: '2024-06-18T10:00:00Z', createdBy: 'Neo' },
  { id: 'a2', title: 'New AI Assistant Features', excerpt: 'Homie can now help with property comparisons and market analysis', category: 'features', targetAudience: 'all', published: true, createdAt: '2024-06-15T14:00:00Z', createdBy: 'Neo' },
  { id: 'a3', title: 'Upcoming: Smart Inventory Automation', excerpt: 'Beta waitlist now open for automated inventory tracking', category: 'releases', targetAudience: 'premium_users', published: true, createdAt: '2024-06-12T09:00:00Z', createdBy: 'Neo' },
];

export const adminAnnouncementService = {
  /** Get all announcements */
  getAll: async (): Promise<Announcement[]> => {
    try {
      const data = await AsyncStorage.getItem(ANNOUNCEMENTS_KEY);
      return data ? JSON.parse(data) : MOCK_ANNOUNCEMENTS;
    } catch {
      return MOCK_ANNOUNCEMENTS;
    }
  },

  /** Create a new announcement */
  create: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const existing = await adminAnnouncementService.getAll();
    const entry: Announcement = {
      ...announcement,
      id: 'ann_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      createdAt: new Date().toISOString(),
    };
    existing.unshift(entry);
    await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(existing));
    return entry;
  },

  /** Toggle publish status */
  togglePublish: async (announcementId: string): Promise<Announcement | null> => {
    const existing = await adminAnnouncementService.getAll();
    const idx = existing.findIndex(a => a.id === announcementId);
    if (idx === -1) return null;
    existing[idx].published = !existing[idx].published;
    await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(existing));
    return existing[idx];
  },

  /** Delete an announcement */
  delete: async (announcementId: string): Promise<void> => {
    const existing = await adminAnnouncementService.getAll();
    const filtered = existing.filter(a => a.id !== announcementId);
    await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(filtered));
  },
};

// ============================================================
// Platform Health
// ============================================================

export const adminHealthService = {
  /** Get current platform health status */
  getHealth: async (): Promise<PlatformHealth> => {
    // In production, this would ping actual services
    return {
      database: 'healthy',
      api: 'healthy',
      authentication: 'healthy',
      emailService: 'warning',
      aiService: 'healthy',
      storageUsage: 62,
      serverResponseTime: 145,
      errorRate: 0.3,
    };
  },

  /** Get overview analytics */
  getOverview: async (): Promise<{
    totalUsers: number;
    activeUsersToday: number;
    activeUsersThisMonth: number;
    newRegistrations: number;
    returningUsers: number;
    businessesRegistered: number;
    premiumMembers: number;
    waitlistMembers: number;
    referralSignups: number;
    featureRequestsSubmitted: number;
    supportTicketsOpen: number;
    platformHealth: PlatformHealth;
  }> => {
    const health = await adminHealthService.getHealth();
    const supportTickets = await adminSupportService.getAll();
    const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

    return {
      totalUsers: 1256,
      activeUsersToday: 342,
      activeUsersThisMonth: 892,
      newRegistrations: 47,
      returningUsers: 211,
      businessesRegistered: 89,
      premiumMembers: 1256,
      waitlistMembers: 0,
      referralSignups: 156,
      featureRequestsSubmitted: 0,
      supportTicketsOpen: openTickets,
      platformHealth: health,
    };
  },
};
