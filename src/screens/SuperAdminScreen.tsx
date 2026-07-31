/**
 * HAMA™ Super Admin Control Center
 *
 * Enterprise Operations & Platform Management System.
 * Only authorized Super Admin accounts may access this area.
 *
 * Sections:
 * - Dashboard: Overview metrics, platform health
 * - Users: User directory with search/filter/actions
 * - Businesses: Business management (verify, suspend, flag)
 * - Monetization: Global feature flags, pricing management
 * - Analytics: User/growth/feature analytics, revenue forecast
 * - Support: Support ticket management
 * - Features: Feature request hub (approve/reject/prioritize)
 * - Announcements: Create, schedule, publish announcements
 * - Security: Admin roles, session monitoring
 * - Audit Logs: Track all platform actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { EarlyAccessBadge } from '../components/EarlyAccessBadge';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { logEvent } from '../utils/analytics';
import {
  adminHealthService,
  adminUserService,
  adminSupportService,
  adminAnnouncementService,
  adminFeatureFlagService,
  adminActionService,
} from '../services/adminService';
import { featureRequestService } from '../services/earlyAccessService';
import { FEATURE_REQUEST_STATUSES, FEATURE_REQUEST_CATEGORIES, ADMIN_ROLE_PERMISSIONS } from '../constants/types';
import type {
  User,
  SupportTicket,
  SupportTicketStatus,
  Announcement,
  FeatureFlags,
  AdminAction,
  PlatformHealth,
  FeatureRequest,
  FeatureRequestStatus,
  AdminRole,
} from '../constants/types';

type AdminTab = 'dashboard' | 'users' | 'businesses' | 'monetization' | 'analytics' | 'support' | 'features' | 'announcements' | 'security' | 'audit';

const ADMIN_TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer' },
  { key: 'users', label: 'Users', icon: 'people' },
  { key: 'businesses', label: 'Businesses', icon: 'business' },
  { key: 'monetization', label: 'Monetization', icon: 'cash' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  { key: 'support', label: 'Support', icon: 'headset' },
  { key: 'features', label: 'Features', icon: 'bulb' },
  { key: 'announcements', label: 'Announce', icon: 'megaphone' },
  { key: 'security', label: 'Security', icon: 'shield' },
  { key: 'audit', label: 'Audit Log', icon: 'document-text' },
];

const MOCK_ANALYTICS = {
  dailyActiveUsers: [342, 389, 401, 378, 412, 398, 423],
  monthlyActiveUsers: 892,
  userRetention: 87,
  userChurn: 4.2,
  avgSessionDuration: '12m 34s',
  registrationTrend: [12, 18, 25, 30, 28, 35, 47],
  referralGrowth: 15.2,
  waitlistGrowth: 23.5,
  featureAdoption: {
    aiAssistant: 72,
    marketplace: 88,
    analytics: 54,
    inventory: 31,
    crm: 28,
  },
  upgradeInterest: [
    { plan: 'Professional', interested: 126, price: 299, currency: 'KSh' as const },
    { plan: 'Enterprise', interested: 44, price: 699, currency: 'KSh' as const },
    { plan: 'Startup', interested: 307, price: 99, currency: 'KSh' as const },
  ],
};

// Mock businesses data
const MOCK_BUSINESSES = [
  { id: 'b1', name: 'Urban Nest Furniture', owner: 'James Mwangi', industry: 'Retail', country: 'Kenya', employees: 12, registrationDate: '2024-01-15', activity: 'high', verified: true },
  { id: 'b2', name: 'Tech Haven KE', owner: 'Faith Njeri', industry: 'Electronics', country: 'Kenya', employees: 8, registrationDate: '2024-03-20', activity: 'high', verified: true },
  { id: 'b3', name: 'Home Essentials', owner: 'David Ochieng', industry: 'Home Goods', country: 'Kenya', employees: 5, registrationDate: '2024-04-10', activity: 'medium', verified: false },
  { id: 'b4', name: 'QuickFix Plumbers', owner: 'Peter Kamau', industry: 'Services', country: 'Kenya', employees: 15, registrationDate: '2024-02-01', activity: 'high', verified: true },
  { id: 'b5', name: 'Elite Cleaners', owner: 'Grace Wanjiku', industry: 'Cleaning Services', country: 'Kenya', employees: 25, registrationDate: '2023-11-05', activity: 'medium', verified: true },
];

// Mock referral data
const MOCK_REFERRERS = [
  { name: 'James Mwangi', referrals: 8, signups: 5, reward: 'Founding Member Gold' },
  { name: 'Grace Wanjiku', referrals: 12, signups: 8, reward: 'VIP Founding Circle' },
  { name: 'Faith Njeri', referrals: 4, signups: 3, reward: 'Early Access Plus' },
  { name: 'Peter Kamau', referrals: 2, signups: 1, reward: 'None' },
];

interface SuperAdminScreenProps {
  navigation?: any;
}

export const SuperAdminScreen: React.FC<SuperAdminScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [overview, setOverview] = useState<any>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [overviewData, flags, tickets, actions, allUsers, features, anns] = await Promise.all([
          adminHealthService.getOverview(),
          adminFeatureFlagService.getAll(),
          adminSupportService.getAll(),
          adminActionService.getAll(),
          adminUserService.getAll(),
          featureRequestService.getAll(),
          adminAnnouncementService.getAll(),
        ]);
        setOverview(overviewData);
        setFeatureFlags(flags);
        setSupportTickets(tickets);
        setAdminActions(actions);
        setUsers(allUsers);
        setFeatureRequests(features);
        setAnnouncements(anns);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const totalForecast = MOCK_ANALYTICS.upgradeInterest.reduce((s, i) => s + i.interested * i.price, 0);

  const isSuperAdmin = currentUser.role === 'admin' || currentUser.role === 'hamisha_squad';

  // ===== PLATFORM HEALTH =====
  const healthStatus = (status: string) => {
    const colors: Record<string, string> = { healthy: COLORS.success, warning: COLORS.warning, critical: COLORS.error };
    const labels: Record<string, string> = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical' };
    return { color: colors[status] || COLORS.textTertiary, label: labels[status] || status };
  };

  // ===== TOGGLE FEATURE FLAG =====
  const toggleFeatureFlag = async (key: keyof FeatureFlags) => {
    if (!featureFlags) return;
    const updated = await adminFeatureFlagService.update({ [key]: !featureFlags[key] });
    setFeatureFlags(updated);
    await adminActionService.record({
      adminUserId: currentUser.id,
      adminName: currentUser.name,
      action: 'feature_flag_toggled',
      resourceType: 'feature_flag',
      details: `${key} → ${updated[key]}`,
    });
    logEvent('feature_used', { flag: key, value: String(updated[key]) });
  };

  // ===== UPDATE TICKET STATUS =====
  const updateTicketStatus = async (ticketId: string, status: SupportTicketStatus) => {
    const updated = await adminSupportService.updateStatus(ticketId, status, currentUser.name);
    if (updated) {
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      await adminActionService.record({
        adminUserId: currentUser.id,
        adminName: currentUser.name,
        action: 'ticket_status_updated',
        resourceType: 'support_ticket',
        resourceId: ticketId,
        details: `Status → ${status}`,
      });
      Alert.alert('Updated', `Ticket marked as ${status}`);
    }
  };

  // ===== UPDATE FEATURE REQUEST STATUS =====
  const updateFeatureRequestStatus = async (requestId: string, status: FeatureRequestStatus) => {
    const updated = await featureRequestService.updateStatus(requestId, status);
    if (updated) {
      setFeatureRequests(prev => prev.map(r => r.id === requestId ? updated : r));
      await adminActionService.record({
        adminUserId: currentUser.id,
        adminName: currentUser.name,
        action: 'feature_request_status_updated',
        resourceType: 'feature_request',
        resourceId: requestId,
        details: `Status → ${status}`,
      });
      Alert.alert('Updated', `Feature request marked as ${status}`);
    }
  };

  // ===== ANNOUNCEMENT MANAGEMENT =====
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', excerpt: '', category: 'updates' as Announcement['category'], targetAudience: 'all' as Announcement['targetAudience'] });

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.excerpt.trim()) {
      Alert.alert('Missing fields', 'Please provide a title and excerpt.');
      return;
    }
    const entry = await adminAnnouncementService.create({
      title: newAnnouncement.title.trim(),
      excerpt: newAnnouncement.excerpt.trim(),
      category: newAnnouncement.category,
      targetAudience: newAnnouncement.targetAudience,
      published: true,
      createdBy: currentUser.name,
    });
    setAnnouncements(prev => [entry, ...prev]);
    setNewAnnouncement({ title: '', excerpt: '', category: 'updates', targetAudience: 'all' });
    await adminActionService.record({
      adminUserId: currentUser.id,
      adminName: currentUser.name,
      action: 'announcement_created',
      resourceType: 'announcement',
      resourceId: entry.id,
      details: entry.title,
    });
    Alert.alert('Published', 'Announcement created and published.');
  };

  const toggleAnnouncement = async (announcementId: string) => {
    const updated = await adminAnnouncementService.togglePublish(announcementId);
    if (updated) {
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? updated : a));
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    await adminAnnouncementService.delete(announcementId);
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    Alert.alert('Deleted', 'Announcement removed.');
  };

  // ===== RENDER TAB CONTENT =====
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'businesses': return renderBusinesses();
      case 'monetization': return renderMonetization();
      case 'analytics': return renderAnalytics();
      case 'support': return renderSupport();
      case 'features': return renderFeatureRequests();
      case 'announcements': return renderAnnouncements();
      case 'security': return renderSecurity();
      case 'audit': return renderAuditLog();
      default: return renderDashboard();
    }
  };

  // ================================================================
  // 1. DASHBOARD TAB
  // ================================================================
  const renderDashboard = () => (
    <>
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.metricsGrid}>
        <MetricCard icon="people" value={overview?.totalUsers.toLocaleString() ?? '---'} label="Total Users" color={COLORS.primary} />
        <MetricCard icon="person-check" value={overview?.activeUsersToday.toLocaleString() ?? '---'} label="Active Today" color={COLORS.accent} />
        <MetricCard icon="trending-up" value={overview?.newRegistrations.toString() ?? '---'} label="New Today" color={COLORS.info} />
      </View>
      <View style={styles.metricsGrid}>
        <MetricCard icon="star" value={overview?.premiumMembers.toLocaleString() ?? '---'} label="Premium Members" color={COLORS.warning} />
        <MetricCard icon="notifications" value={overview?.waitlistMembers.toLocaleString() ?? '---'} label="Waitlist" color={COLORS.secondary} />
        <MetricCard icon="headset" value={overview?.supportTicketsOpen.toString() ?? '---'} label="Open Tickets" color={COLORS.error} />
      </View>

      <Text style={styles.sectionTitle}>Platform Health</Text>
      <GlassCard>
        {overview?.platformHealth && (
          <View style={styles.healthGrid}>
            {(['database', 'api', 'authentication', 'emailService', 'aiService'] as (keyof PlatformHealth)[]).map((key) => {
              const value = overview.platformHealth[key];
              if (typeof value !== 'string' || !['healthy', 'warning', 'critical'].includes(value)) return null;
              const hc = healthStatus(value);
              return (
                <View key={key} style={styles.healthRow}>
                  <Text style={styles.healthLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </Text>
                  <View style={[styles.healthDot, { backgroundColor: hc.color }]} />
                  <Text style={[styles.healthValue, { color: hc.color }]}>{hc.label}</Text>
                </View>
              );
            })}
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Storage Usage</Text>
              <View style={styles.healthBarBg}>
                <View style={[styles.healthBarFill, { width: `${overview.platformHealth.storageUsage}%`, backgroundColor: overview.platformHealth.storageUsage > 80 ? COLORS.warning : COLORS.accent }]} />
              </View>
              <Text style={styles.healthValue}>{overview.platformHealth.storageUsage}%</Text>
            </View>
            <View style={[styles.healthRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.healthLabel}>Response Time</Text>
              <Text style={styles.healthValue}>{overview.platformHealth.serverResponseTime}ms</Text>
              <Text style={[styles.healthDotText, { color: overview.platformHealth.serverResponseTime < 200 ? COLORS.success : COLORS.warning }]}>
                {overview.platformHealth.serverResponseTime < 200 ? 'Fast' : 'Slow'}
              </Text>
            </View>
          </View>
        )}
      </GlassCard>
    </>
  );

  // ================================================================
  // 2. USERS TAB
  // ================================================================
  const renderUsers = () => (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone, or ID..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={styles.filterChip} onPress={() => setSearchQuery('')}>
          <Text style={styles.filterChipText}>All</Text>
        </TouchableOpacity>
        {['admin', 'seeker', 'landlord', 'seller', 'service_provider'].map(role => (
          <TouchableOpacity key={role} style={styles.filterChip} onPress={() => setSearchQuery(role)}>
            <Text style={styles.filterChipText}>{role.replace('_', ' ').replace(/^./, s => s.toUpperCase())}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredUsers.map((user) => (
        <GlassCard key={user.id}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.name}
                {user.businessName ? ` • ${user.businessName}` : ''}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userBadges}>
                <View style={[styles.userBadge, { backgroundColor: COLORS.primary + '20' }]}>
                  <Text style={[styles.userBadgeText, { color: COLORS.primary }]}>{user.role.replace('_', ' ')}</Text>
                </View>
                {user.verified && (
                  <View style={[styles.userBadge, { backgroundColor: COLORS.accent + '20' }]}>
                    <Text style={[styles.userBadgeText, { color: COLORS.accent }]}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>
                {user.country && `${user.country}`}{user.businessType ? ` • ${user.businessType}` : ''}
                {user.lastLoginAt ? ` • Last: ${new Date(user.lastLoginAt).toLocaleDateString()}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.userAction}>
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}
    </>
  );

  // ================================================================
  // 3. BUSINESSES TAB
  // ================================================================
  const renderBusinesses = () => (
    <>
      <Text style={styles.sectionTitle}>Registered Businesses</Text>
      <Text style={styles.cardHelp}>View and manage all businesses registered on the HAMA™ platform.</Text>

      <View style={styles.metricsGrid}>
        <MetricCard icon="business" value={MOCK_BUSINESSES.length.toString()} label="Total" color={COLORS.primary} />
        <MetricCard icon="checkmark-circle" value={MOCK_BUSINESSES.filter(b => b.verified).length.toString()} label="Verified" color={COLORS.accent} />
        <MetricCard icon="trending-up" value={MOCK_BUSINESSES.filter(b => b.activity === 'high').length.toString()} label="Active" color={COLORS.info} />
      </View>

      {MOCK_BUSINESSES.map((biz) => (
        <GlassCard key={biz.id}>
          <View style={styles.bizHeader}>
            <View style={styles.bizIcon}>
              <Ionicons name="business" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.bizInfo}>
              <Text style={styles.userName}>{biz.name}</Text>
              <Text style={styles.userEmail}>Owner: {biz.owner} • {biz.industry}</Text>
            </View>
            <View style={[styles.userBadge, { backgroundColor: biz.verified ? COLORS.accent + '20' : COLORS.warning + '20' }]}>
              <Text style={[styles.userBadgeText, { color: biz.verified ? COLORS.accent : COLORS.warning }]}>
                {biz.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
          <View style={styles.bizDetails}>
            <View style={styles.bizDetailItem}>
              <Ionicons name="globe" size={14} color={COLORS.textTertiary} />
              <Text style={styles.bizDetailText}>{biz.country}</Text>
            </View>
            <View style={styles.bizDetailItem}>
              <Ionicons name="people" size={14} color={COLORS.textTertiary} />
              <Text style={styles.bizDetailText}>{biz.employees} employees</Text>
            </View>
            <View style={styles.bizDetailItem}>
              <Ionicons name="calendar" size={14} color={COLORS.textTertiary} />
              <Text style={styles.bizDetailText}>Since {new Date(biz.registrationDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.bizDetailItem}>
              <Ionicons name={biz.activity === 'high' ? 'pulse' : 'remove-circle'} size={14} color={biz.activity === 'high' ? COLORS.accent : COLORS.textTertiary} />
              <Text style={styles.bizDetailText}>{biz.activity.charAt(0).toUpperCase() + biz.activity.slice(1)} activity</Text>
            </View>
          </View>
          <View style={styles.bizActions}>
            <TouchableOpacity style={styles.bizActionBtn} onPress={() => Alert.alert('Verify', `${biz.name} verified successfully.`)}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
              <Text style={[styles.bizActionText, { color: COLORS.accent }]}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bizActionBtn} onPress={() => Alert.alert('Flag', `${biz.name} flagged for review.`)}>
              <Ionicons name="flag" size={16} color={COLORS.warning} />
              <Text style={[styles.bizActionText, { color: COLORS.warning }]}>Flag</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bizActionBtn} onPress={() => Alert.alert('View', `Viewing ${biz.name} details.`)}>
              <Ionicons name="eye" size={16} color={COLORS.primary} />
              <Text style={[styles.bizActionText, { color: COLORS.primary }]}>View</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}
    </>
  );

  // ================================================================
  // 4. MONETIZATION TAB
  // ================================================================
  const renderMonetization = () => (
    <>
      <Text style={styles.sectionTitle}>Global System Settings</Text>
      <GlassCard>
        {featureFlags && (
          <View style={styles.flagsContainer}>
            <FlagToggle label="Early Access Mode" value={featureFlags.earlyAccessMode} onToggle={() => toggleFeatureFlag('earlyAccessMode')} color={COLORS.primary} />
            <FlagToggle label="Subscriptions Enabled" value={featureFlags.subscriptionsEnabled} onToggle={() => toggleFeatureFlag('subscriptionsEnabled')} color={COLORS.secondary} />
            <FlagToggle label="Payments Enabled" value={featureFlags.paymentsEnabled} onToggle={() => toggleFeatureFlag('paymentsEnabled')} color={COLORS.accent} />
          </View>
        )}
      </GlassCard>

      <Text style={styles.sectionTitle}>Feature Flags</Text>
      <GlassCard>
        {featureFlags && (
          <View style={styles.flagsContainer}>
            <FlagToggle label="AI Assistant" value={featureFlags.aiAssistant} onToggle={() => toggleFeatureFlag('aiAssistant')} color={COLORS.primary} />
            <FlagToggle label="Marketplace" value={featureFlags.marketplace} onToggle={() => toggleFeatureFlag('marketplace')} color={COLORS.accent} />
            <FlagToggle label="Analytics" value={featureFlags.analytics} onToggle={() => toggleFeatureFlag('analytics')} color={COLORS.secondary} />
            <FlagToggle label="Inventory" value={featureFlags.inventory} onToggle={() => toggleFeatureFlag('inventory')} color={COLORS.warning} />
            <FlagToggle label="CRM" value={featureFlags.crm} onToggle={() => toggleFeatureFlag('crm')} color={COLORS.info} />
            <FlagToggle label="Referral System" value={featureFlags.referralSystem} onToggle={() => toggleFeatureFlag('referralSystem')} color={COLORS.primaryLight} />
            <FlagToggle label="Waitlist" value={featureFlags.waitlist} onToggle={() => toggleFeatureFlag('waitlist')} color={COLORS.secondary} />
            <FlagToggle label="Beta Features" value={featureFlags.betaFeatures} onToggle={() => toggleFeatureFlag('betaFeatures')} color={COLORS.accent} />
          </View>
        )}
      </GlassCard>

      {/* Pricing Management */}
      <Text style={styles.sectionTitle}>Pricing Plans</Text>
      <GlassCard>
        <Text style={styles.cardHelp}>Configure subscription plans. Toggle early access mode to unlock all features for Founding Members.</Text>
        <View style={styles.planRows}>
          {[
            { name: 'Free', price: 0, tier: 'Basic', billing: 'Forever', color: COLORS.textTertiary },
            { name: 'Starter', price: 99, tier: 'Individuals', billing: 'Monthly', color: COLORS.primaryLight },
            { name: 'Premium', price: 299, tier: 'Professionals', billing: 'Monthly', color: COLORS.primary },
            { name: 'Professional', price: 699, tier: 'Businesses', billing: 'Monthly', color: COLORS.warning },
            { name: 'Enterprise', price: 1499, tier: 'Corporations', billing: 'Monthly', color: COLORS.accent },
          ].map((plan, i) => (
            <View key={i} style={styles.planRow}>
              <View style={[styles.planDot, { backgroundColor: plan.color + '30' }]}>
                <View style={[styles.planDotInner, { backgroundColor: plan.color }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDesc}>{plan.tier} • {plan.billing}</Text>
              </View>
              <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price === 0 ? 'Free' : `KSh ${plan.price.toLocaleString()}`}</Text>
              <TouchableOpacity style={styles.planEditBtn}>
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.addPlanBtn} onPress={() => Alert.alert('Create Plan', 'New plan creation form would open here.')}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addPlanText}>Add New Plan</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Referral Management */}
      <Text style={styles.sectionTitle}>Referral Management</Text>
      <GlassCard>
        <View style={styles.metricsGrid}>
          <MetricCard icon="people" value={MOCK_REFERRERS.reduce((s, r) => s + r.referrals, 0).toString()} label="Total Referrals" color={COLORS.primary} />
          <MetricCard icon="checkmark-circle" value={MOCK_REFERRERS.reduce((s, r) => s + r.signups, 0).toString()} label="Signups" color={COLORS.accent} />
          <MetricCard icon="trending-up" value="15.2%" label="Growth Rate" color={COLORS.info} />
        </View>

        <Text style={styles.cardTitle}>Top Referrers</Text>
        {MOCK_REFERRERS.map((ref, i) => (
          <View key={i} style={styles.referrerRow}>
            <View style={styles.referrerRank}>
              <Text style={styles.referrerRankText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{ref.name}</Text>
              <Text style={styles.userEmail}>{ref.referrals} referrals • {ref.signups} signups</Text>
            </View>
            <View style={[styles.userBadge, { backgroundColor: ref.reward !== 'None' ? COLORS.warning + '20' : COLORS.textTertiary + '20' }]}>
              <Text style={[styles.userBadgeText, { color: ref.reward !== 'None' ? COLORS.warning : COLORS.textTertiary }]}>
                {ref.reward}
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>
    </>
  );

  // ================================================================
  // 5. ANALYTICS TAB
  // ================================================================
  const renderAnalytics = () => (
    <>
      {/* User Analytics */}
      <Text style={styles.sectionTitle}>User Analytics</Text>
      <View style={styles.metricsGrid}>
        <MetricCard icon="people" value={MOCK_ANALYTICS.monthlyActiveUsers.toLocaleString()} label="MAU" color={COLORS.primary} />
        <MetricCard icon="heart" value={`${MOCK_ANALYTICS.userRetention}%`} label="Retention" color={COLORS.accent} />
        <MetricCard icon="trending-down" value={`${MOCK_ANALYTICS.userChurn}%`} label="Churn" color={COLORS.error} />
      </View>

      {/* Growth Analytics */}
      <Text style={styles.sectionTitle}>Growth Analytics</Text>
      <GlassCard>
        <Text style={styles.cardTitle}>Registration Trends (Last 7 Days)</Text>
        <View style={styles.trendChart}>
          {MOCK_ANALYTICS.registrationTrend.map((val, i) => {
            const maxVal = Math.max(...MOCK_ANALYTICS.registrationTrend);
            const height = (val / maxVal) * 100;
            return (
              <View key={i} style={styles.trendBarCol}>
                <Text style={styles.trendBarValue}>{val}</Text>
                <View style={[styles.trendBar, { height: `${height}%`, backgroundColor: COLORS.primary }]} />
                <Text style={styles.trendBarLabel}>D{i + 1}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      {/* Revenue Forecast */}
      <Text style={styles.sectionTitle}>Revenue Forecast</Text>
      <GlassCard>
        <LinearGradient colors={['rgba(0, 212, 170, 0.08)', 'rgba(255, 107, 0, 0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.forecastCard}>
          <Ionicons name="cash-outline" size={28} color={COLORS.accent} />
          <Text style={styles.forecastTitle}>Projected Monthly Revenue</Text>
          <Text style={styles.forecastValue}>{formatPrice(totalForecast, 'KSh')}/mo</Text>
          <Text style={styles.forecastSub}>Projected Annual: {formatPrice(totalForecast * 12, 'KSh')}/yr</Text>

          {MOCK_ANALYTICS.upgradeInterest.map((item, i) => (
            <View key={i} style={styles.forecastBreakdown}>
              <Text style={styles.forecastBreakdownLabel}>{item.plan} Plan</Text>
              <Text style={styles.forecastBreakdownValue}>{item.interested} users × KSh {item.price.toLocaleString()} = {formatPrice(item.interested * item.price, 'KSh')}</Text>
            </View>
          ))}
        </LinearGradient>
      </GlassCard>

      {/* Feature Adoption */}
      <Text style={styles.sectionTitle}>Feature Adoption</Text>
      <GlassCard>
        {Object.entries(MOCK_ANALYTICS.featureAdoption).map(([feature, rate]) => (
          <View key={feature} style={styles.adoptionRow}>
            <Text style={styles.adoptionLabel}>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</Text>
            <View style={styles.adoptionBarBg}>
              <View style={[styles.adoptionBarFill, { width: `${rate}%`, backgroundColor: rate > 60 ? COLORS.accent : rate > 30 ? COLORS.warning : COLORS.error }]} />
            </View>
            <Text style={styles.adoptionRate}>{rate}%</Text>
          </View>
        ))}
      </GlassCard>
    </>
  );

  // ================================================================
  // 6. SUPPORT TAB
  // ================================================================
  const renderSupport = () => (
    <>
      <View style={styles.metricsGrid}>
        <MetricCard icon="mail-open" value={openTickets.length.toString()} label="Open" color={COLORS.error} />
        <MetricCard icon="checkmark-circle" value={supportTickets.filter(t => t.status === 'resolved').length.toString()} label="Resolved" color={COLORS.accent} />
        <MetricCard icon="people" value={supportTickets.length.toString()} label="Total" color={COLORS.primary} />
      </View>

      {supportTickets.map((ticket) => {
        const statusColors: Record<SupportTicketStatus, string> = {
          open: COLORS.error,
          in_progress: COLORS.warning,
          resolved: COLORS.accent,
          closed: COLORS.textTertiary,
        };
        return (
          <GlassCard key={ticket.id}>
            <View style={styles.ticketHeader}>
              <View style={[styles.ticketStatusDot, { backgroundColor: statusColors[ticket.status] }]} />
              <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
              <TouchableOpacity
                style={styles.ticketAction}
                onPress={() => {
                  const nextStatus: Record<SupportTicketStatus, SupportTicketStatus> = {
                    open: 'in_progress',
                    in_progress: 'resolved',
                    resolved: 'closed',
                    closed: 'open',
                  };
                  updateTicketStatus(ticket.id, nextStatus[ticket.status]);
                }}
              >
                <Text style={styles.ticketActionText}>Advance</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ticketMeta}>
              {ticket.userName} • {ticket.category.replace(/_/g, ' ')} • {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
          </GlassCard>
        );
      })}
    </>
  );

  // ================================================================
  // 7. FEATURE REQUESTS TAB
  // ================================================================
  const renderFeatureRequests = () => (
    <>
      <Text style={styles.sectionTitle}>Feature Request Hub</Text>

      <View style={styles.metricsGrid}>
        <MetricCard icon="bulb" value={featureRequests.length.toString()} label="Total" color={COLORS.warning} />
        <MetricCard icon="hourglass" value={featureRequests.filter(r => r.status === 'planned').length.toString()} label="Planned" color={COLORS.info} />
        <MetricCard icon="checkmark-circle" value={featureRequests.filter(r => r.status === 'released').length.toString()} label="Released" color={COLORS.accent} />
      </View>

      {featureRequests.length === 0 ? (
        <GlassCard>
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No feature requests yet</Text>
            <Text style={styles.emptyText}>Feature requests submitted by users will appear here. You can approve, reject, or add them to the roadmap.</Text>
          </View>
        </GlassCard>
      ) : (
        featureRequests
          .sort((a, b) => b.votes - a.votes)
          .map((req) => {
            const statusInfo = FEATURE_REQUEST_STATUSES.find(s => s.key === req.status);
            const catInfo = FEATURE_REQUEST_CATEGORIES.find(c => c.key === req.category);
            return (
              <GlassCard key={req.id}>
                <View style={styles.featureHeader}>
                  <View style={styles.featureVotes}>
                    <Ionicons name="arrow-up" size={16} color={COLORS.warning} />
                    <Text style={styles.featureVoteCount}>{req.votes}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{req.title}</Text>
                    <Text style={styles.featureDesc} numberOfLines={2}>{req.description}</Text>
                    <View style={styles.featureMeta}>
                      <View style={[styles.featureTag, { backgroundColor: (statusInfo?.color ?? COLORS.textTertiary) + '20' }]}>
                        <Text style={[styles.featureTagText, { color: statusInfo?.color ?? COLORS.textTertiary }]}>
                          {statusInfo?.label ?? req.status}
                        </Text>
                      </View>
                      <View style={[styles.featureTag, { backgroundColor: COLORS.primary + '20' }]}>
                        <Text style={[styles.featureTagText, { color: COLORS.primary }]}>{catInfo?.label ?? req.category}</Text>
                      </View>
                      <Text style={styles.featureTagText}>{req.userName ?? 'Anonymous'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.featureActions}>
                  {(['planned', 'in_development', 'testing', 'released'] as FeatureRequestStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.featureStatusBtn, req.status === status && { backgroundColor: (FEATURE_REQUEST_STATUSES.find(s => s.key === status)?.color ?? COLORS.primary) + '30' }]}
                      onPress={() => updateFeatureRequestStatus(req.id, status)}
                    >
                      <Text style={[styles.featureStatusBtnText, { color: FEATURE_REQUEST_STATUSES.find(s => s.key === status)?.color ?? COLORS.primary }]}>
                        {FEATURE_REQUEST_STATUSES.find(s => s.key === status)?.label ?? status.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            );
          })
      )}
    </>
  );

  // ================================================================
  // 8. ANNOUNCEMENTS TAB
  // ================================================================
  const renderAnnouncements = () => (
    <>
      {/* Create Announcement */}
      <Text style={styles.sectionTitle}>Create Announcement</Text>
      <GlassCard>
        <TextInput
          style={styles.announceInput}
          placeholder="Announcement title..."
          placeholderTextColor={COLORS.textTertiary}
          value={newAnnouncement.title}
          onChangeText={t => setNewAnnouncement(prev => ({ ...prev, title: t }))}
        />
        <TextInput
          style={[styles.announceInput, styles.announceInputMultiline]}
          placeholder="Brief excerpt..."
          placeholderTextColor={COLORS.textTertiary}
          value={newAnnouncement.excerpt}
          onChangeText={t => setNewAnnouncement(prev => ({ ...prev, excerpt: t }))}
          multiline
        />
        <View style={styles.announcePickerRow}>
          <Text style={styles.pickerLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['updates', 'features', 'releases', 'founder', 'community'] as Announcement['category'][]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.announceChip, newAnnouncement.category === cat && styles.announceChipActive]}
                onPress={() => setNewAnnouncement(prev => ({ ...prev, category: cat }))}
              >
                <Text style={[styles.announceChipText, newAnnouncement.category === cat && styles.announceChipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.createAnnounceBtn} onPress={createAnnouncement}>
          <Ionicons name="megaphone" size={18} color="#fff" />
          <Text style={styles.createAnnounceText}>Publish Announcement</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Existing Announcements */}
      <Text style={styles.sectionTitle}>Published Announcements</Text>
      {announcements.map((ann) => (
        <GlassCard key={ann.id}>
          <View style={styles.announceRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.featureMeta}>
                <View style={[styles.featureTag, { backgroundColor: COLORS.primary + '20' }]}>
                  <Text style={[styles.featureTagText, { color: COLORS.primary }]}>{ann.category}</Text>
                </View>
                <View style={[styles.featureTag, { backgroundColor: ann.published ? COLORS.accent + '20' : COLORS.textTertiary + '20' }]}>
                  <Text style={[styles.featureTagText, { color: ann.published ? COLORS.accent : COLORS.textTertiary }]}>
                    {ann.published ? 'Published' : 'Draft'}
                  </Text>
                </View>
                <Text style={styles.featureTagText}>{ann.targetAudience.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.ticketSubject}>{ann.title}</Text>
              <Text style={styles.ticketMeta} numberOfLines={1}>{ann.excerpt}</Text>
              <Text style={styles.ticketMeta}>{new Date(ann.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.announceActions}>
              <TouchableOpacity onPress={() => toggleAnnouncement(ann.id)}>
                <Ionicons name={ann.published ? 'eye-off' : 'eye'} size={18} color={ann.published ? COLORS.warning : COLORS.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteAnnouncement(ann.id)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      ))}
    </>
  );

  // ================================================================
  // 9. SECURITY TAB
  // ================================================================
  const renderSecurity = () => {
    const roleNames: Record<AdminRole, string> = {
      super_admin: 'Super Admin',
      platform_admin: 'Platform Admin',
      support_manager: 'Support Manager',
      marketing_manager: 'Marketing Manager',
      content_manager: 'Content Manager',
      analyst: 'Analyst',
    };

    const roleIcons: Record<AdminRole, string> = {
      super_admin: 'shield-checkmark',
      platform_admin: 'shield',
      support_manager: 'headset',
      marketing_manager: 'megaphone',
      content_manager: 'document-text',
      analyst: 'analytics',
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Admin Roles & Permissions</Text>
        <GlassCard>
          {(Object.keys(ADMIN_ROLE_PERMISSIONS) as AdminRole[]).map((role, i) => {
            const perms = ADMIN_ROLE_PERMISSIONS[role];
            const permCount = Object.values(perms).filter(Boolean).length;
            const totalPerms = Object.keys(perms).length;
            return (
              <View key={role} style={[styles.roleRow, i === Object.keys(ADMIN_ROLE_PERMISSIONS).length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.roleIcon, { backgroundColor: role === 'super_admin' ? COLORS.warning + '20' : COLORS.primary + '15' }]}>
                  <Ionicons name={roleIcons[role] as any} size={18} color={role === 'super_admin' ? COLORS.warning : COLORS.primary} />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>{roleNames[role]}</Text>
                  <Text style={styles.roleUsers}>{permCount}/{totalPerms} permissions</Text>
                </View>
                <View style={styles.rolePermDot}>
                  <View style={[styles.permBar, { width: `${(permCount / totalPerms) * 100}%`, backgroundColor: permCount === totalPerms ? COLORS.accent : permCount > totalPerms / 2 ? COLORS.warning : COLORS.error }]} />
                </View>
              </View>
            );
          })}
        </GlassCard>

        <Text style={styles.sectionTitle}>Security Status</Text>
        <GlassCard>
          {[
            { label: 'Two-Factor Authentication', status: 'Enabled', color: COLORS.accent, icon: 'shield-checkmark' },
            { label: 'Session Monitoring', status: 'Active', color: COLORS.accent, icon: 'eye' },
            { label: 'Suspicious Login Detection', status: 'Active', color: COLORS.accent, icon: 'warning' },
            { label: 'Account Locking', status: 'After 5 attempts', color: COLORS.warning, icon: 'lock-closed' },
            { label: 'Security Alerts', status: 'Enabled', color: COLORS.accent, icon: 'notifications' },
          ].map((item, i) => (
            <View key={i} style={styles.securityRow}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
              <Text style={styles.securityLabel}>{item.label}</Text>
              <Text style={[styles.securityValue, { color: item.color }]}>{item.status}</Text>
            </View>
          ))}
        </GlassCard>
      </>
    );
  };

  // ================================================================
  // 10. AUDIT LOG TAB
  // ================================================================
  const renderAuditLog = () => (
    <>
      <Text style={styles.sectionTitle}>Admin Action Log</Text>
      {adminActions.length === 0 ? (
        <GlassCard>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No admin actions recorded yet</Text>
            <Text style={styles.emptyText}>Admin actions will appear here as they are performed (e.g., toggling feature flags, updating tickets).</Text>
          </View>
        </GlassCard>
      ) : (
        adminActions.map((action) => (
          <GlassCard key={action.id}>
            <View style={styles.actionRow}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionType}>{action.action.replace(/_/g, ' ')}</Text>
                <Text style={styles.actionTime}>{new Date(action.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.actionAdmin}>{action.adminName}</Text>
              <Text style={styles.actionResource}>{action.resourceType}{action.resourceId ? ` #${action.resourceId}` : ''}</Text>
              {action.details && <Text style={styles.actionDetails}>{action.details}</Text>}
            </View>
          </GlassCard>
        ))
      )}
    </>
  );

  // ===== ROLE GUARD =====
  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.headerTitle}>Access Denied</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Ionicons name="shield-outline" size={64} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Super Admin Access Required</Text>
          <Text style={styles.emptyText}>You do not have permission to access this area. Only authorized Super Admin accounts may enter.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Admin Center</Text>
            <EarlyAccessBadge variant="compact" text="SUPER ADMIN" />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Enterprise operations & platform management</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {ADMIN_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#fff' : COLORS.textTertiary}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader type="list" count={6} />
          </View>
        ) : (
          renderTabContent()
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ===== SUB-COMPONENTS =====

const MetricCard: React.FC<{ icon: string; value: string; label: string; color: string }> = ({ icon, value, label, color }) => (
  <GlassCard style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </GlassCard>
);

const FlagToggle: React.FC<{ label: string; value: boolean; onToggle: () => void; color: string }> = ({ label, value, onToggle, color }) => (
  <TouchableOpacity style={styles.flagRow} onPress={onToggle}>
    <View style={[styles.flagDot, { backgroundColor: value ? color : COLORS.textTertiary }]} />
    <Text style={styles.flagLabel}>{label}</Text>
    <View style={[styles.toggle, value && { backgroundColor: color + '30', borderColor: color }]}>
      <View style={[styles.toggleKnob, value && { backgroundColor: color, transform: [{ translateX: 16 }] }]} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { ...FONTS.h1, color: COLORS.text },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  tabBar: { maxHeight: 52, marginBottom: SPACING.sm },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.glassBorder, marginLeft: SPACING.md },
  tabItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '500' },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: SPACING.md, gap: SPACING.md },
  sectionTitle: { ...FONTS.h3, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: SPACING.xs, marginBottom: -4 },
  metricsGrid: { flexDirection: 'row', gap: 8 },
  metricCard: { flex: 1, padding: SPACING.sm, alignItems: 'center', gap: 2 },
  metricIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  metricValue: { ...FONTS.h3, color: COLORS.text, fontSize: 18 },
  metricLabel: { color: COLORS.textTertiary, fontSize: 9, fontWeight: '600', textAlign: 'center' },

  // Health
  healthGrid: { gap: 8 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  healthLabel: { flex: 1, color: COLORS.text, fontSize: 13 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthDotText: { fontSize: 12, fontWeight: '600' },
  healthValue: { fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  healthBarBg: { width: 60, height: 6, borderRadius: 3, backgroundColor: COLORS.glassBorder, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: 3 },

  // Search & Filters
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, gap: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 12 },
  filterBar: { marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: 6 },
  filterChipText: { color: COLORS.textSecondary, fontSize: 12 },

  // User rows
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '30', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  userEmail: { color: COLORS.textTertiary, fontSize: 12 },
  userBadges: { flexDirection: 'row', gap: 4, marginTop: 2 },
  userBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.sm },
  userBadgeText: { fontSize: 9, fontWeight: '700' },
  userAction: { padding: 4 },

  // Feature flags
  flagsContainer: { gap: 4 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  flagLabel: { flex: 1, color: COLORS.text, fontSize: 13 },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: COLORS.glassBorder, borderWidth: 1, borderColor: COLORS.glassBorder, justifyContent: 'center', paddingHorizontal: 2 },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.textTertiary },

  // Pricing plans
  planRows: { gap: 8 },
  planDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  planDotInner: { width: 10, height: 10, borderRadius: 5 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  planName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  planDesc: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  planPrice: { fontSize: 15, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  planEditBtn: { padding: 4, marginLeft: 4 },
  addPlanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 10, marginTop: 8, borderWidth: 1, borderColor: COLORS.primary + '40', borderRadius: RADIUS.md, borderStyle: 'dashed' },
  addPlanText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // Referrer rows
  referrerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  referrerRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  referrerRankText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Analytics
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginTop: SPACING.md },
  trendBarCol: { flex: 1, alignItems: 'center', gap: 4 },
  trendBarValue: { color: COLORS.textTertiary, fontSize: 10 },
  trendBar: { width: 20, borderRadius: RADIUS.sm, minHeight: 4 },
  trendBarLabel: { color: COLORS.textTertiary, fontSize: 9 },
  cardTitle: { ...FONTS.h3, color: COLORS.text, marginBottom: 4 },
  cardHelp: { color: COLORS.textTertiary, fontSize: 12, marginBottom: SPACING.sm, lineHeight: 16 },
  forecastCard: { padding: SPACING.lg, alignItems: 'center', gap: 8 },
  forecastTitle: { color: COLORS.textSecondary, fontSize: 13 },
  forecastValue: { ...FONTS.h1, color: COLORS.accent, fontSize: 28 },
  forecastSub: { color: COLORS.textTertiary, fontSize: 12 },
  forecastBreakdown: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 4, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  forecastBreakdownLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  forecastBreakdownValue: { color: COLORS.textTertiary, fontSize: 11 },
  adoptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  adoptionLabel: { flex: 1, color: COLORS.text, fontSize: 13 },
  adoptionBarBg: { width: 100, height: 8, borderRadius: 4, backgroundColor: COLORS.glassBorder, overflow: 'hidden' },
  adoptionBarFill: { height: '100%', borderRadius: 4 },
  adoptionRate: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },

  // Support
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketStatusDot: { width: 8, height: 8, borderRadius: 4 },
  ticketSubject: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
  ticketAction: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary + '20' },
  ticketActionText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  ticketMeta: { color: COLORS.textTertiary, fontSize: 11, marginTop: 4 },
  ticketDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 },

  // Feature requests
  featureHeader: { flexDirection: 'row', gap: 10 },
  featureVotes: { alignItems: 'center', gap: 2, width: 32 },
  featureVoteCount: { color: COLORS.warning, fontSize: 13, fontWeight: '700' },
  featureTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  featureDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 16 },
  featureMeta: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  featureTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.sm },
  featureTagText: { fontSize: 9, fontWeight: '600', color: COLORS.textTertiary },
  featureActions: { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  featureStatusBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.glassBorder },
  featureStatusBtnText: { fontSize: 10, fontWeight: '600' },

  // Announcements
  announceInput: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  announceInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  announcePickerRow: { marginBottom: 8 },
  pickerLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  announceChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: 4 },
  announceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  announceChipText: { fontSize: 11, color: COLORS.textSecondary },
  announceChipTextActive: { color: '#fff', fontWeight: '600' },
  createAnnounceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 12 },
  createAnnounceText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  announceRow: { flexDirection: 'row', gap: 8 },
  announceActions: { flexDirection: 'column', gap: 8, justifyContent: 'center' },

  // Business
  bizHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bizIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  bizInfo: { flex: 1 },
  bizDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  bizDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bizDetailText: { color: COLORS.textTertiary, fontSize: 11 },
  bizActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  bizActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.glassBorder },
  bizActionText: { fontSize: 11, fontWeight: '600' },

  // Security
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  roleIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  roleInfo: { flex: 1 },
  roleName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  roleUsers: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  rolePermDot: { width: 60, height: 6, borderRadius: 3, backgroundColor: COLORS.glassBorder, overflow: 'hidden' },
  permBar: { height: '100%', borderRadius: 3 },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  securityLabel: { flex: 1, color: COLORS.text, fontSize: 13 },
  securityValue: { fontSize: 12, fontWeight: '600' },

  // Audit log
  actionRow: { gap: 4 },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  actionType: { color: COLORS.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  actionTime: { color: COLORS.textTertiary, fontSize: 11 },
  actionAdmin: { color: COLORS.textSecondary, fontSize: 12 },
  actionResource: { color: COLORS.textTertiary, fontSize: 11 },
  actionDetails: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  // States
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { ...FONTS.h3, color: COLORS.textSecondary, textAlign: 'center' },
  emptyText: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  // Loading
  loadingContainer: { padding: SPACING.xl, alignItems: 'center' },
  loadingText: { color: COLORS.textTertiary, fontSize: 14 },
});
