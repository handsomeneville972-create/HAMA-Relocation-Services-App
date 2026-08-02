import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAuth } from '../contexts/AuthContext';
import { useProfileBadges } from '../hooks/useUserData';
import { getCommunityPosts } from '../services/communityService';
import { ROLE_LABELS, VERIFICATION_LABELS } from '../constants/labels';
import { navigateToRoute } from '../utils/navigation';
import { getActiveWorkspaces, subscribeWorkspaces, type WorkspaceRole } from '../utils/workspaces';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', color: COLORS.primary, route: 'EditProfile' },
      { icon: 'bookmark-outline', label: 'Saved', color: COLORS.accent, route: 'Favorites' },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      { icon: 'star-outline', label: 'My Plan', color: COLORS.primary, badgeKey: 'myPlan', route: 'WorkspacePlans' },
      { icon: 'card-outline', label: 'Payment Methods', color: COLORS.accent, route: 'PaymentMethods' },
      { icon: 'receipt-outline', label: 'Billing History', color: COLORS.textSecondary, route: 'BillingHistory' },
    ],
  },
  {
    title: 'Service Provider',
    items: [
      { icon: 'storefront-outline', label: 'Become a Service Provider', color: COLORS.primary, route: 'ServiceProviderOnboarding' },
      { icon: 'analytics-outline', label: 'Seller Dashboard', color: COLORS.accent, route: 'SellerDashboard' },
      { icon: 'ribbon-outline', label: 'View My Public Profile', color: COLORS.textSecondary, route: 'ServiceProviderProfile' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { icon: 'chatbubble-outline', label: 'Messages', color: COLORS.primary, badgeKey: 'unreadMessages', route: 'Inbox' },
      { icon: 'chatbubble-outline', label: 'My Reviews', color: COLORS.warning, badgeKey: 'myReviews' },
      { icon: 'newspaper-outline', label: 'My Posts', color: COLORS.secondary, route: 'MyPosts' },
      { icon: 'time-outline', label: 'Booking History', color: COLORS.primary },
      { icon: 'cart-outline', label: 'Orders', color: COLORS.accent },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: 'settings-outline', label: 'Settings', color: COLORS.secondary, route: 'Settings' },
    ],
  },
];

const ACTIVE_WORKSPACE_BADGES: Record<WorkspaceRole, string> = {
  house_seeker: 'Free',
  landlord: 'Landlord',
  seller: 'Seller',
  service_provider: 'Provider',
};

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, isAuthenticated, isEmailVerified } = useAuth();
  const { dynamicBadges, savedPropertiesCount, reviewCount, bookmarkCount } = useProfileBadges();
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaces, setActiveWorkspaces] = useState<WorkspaceRole[]>(getActiveWorkspaces());

  useEffect(() => {
    return subscribeWorkspaces(setActiveWorkspaces);
  }, []);

  useEffect(() => {
    let active = true;
    const loadPostCount = async () => {
      if (!currentUserId) { setLoading(false); return; }
      const { data } = await getCommunityPosts({ userId: currentUserId });
      if (active && data) setPostCount(data.length);
      setLoading(false);
    };
    loadPostCount();
    return () => { active = false; };
  }, [currentUserId]);

  // Get verification badge info
  const verificationInfo = VERIFICATION_LABELS[currentUser.verificationLevel] ?? VERIFICATION_LABELS.unverified;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <SkeletonLoader type="profile-header" />
        </LinearGradient>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm }}>
          <SkeletonLoader type="list" count={5} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.profileInfo}>
            <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarBorder}>
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.avatar}
              />
            </LinearGradient>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <Text style={styles.profileEmail}>{currentUser.email}</Text>

              {/* Role Badge */}
              <View style={styles.badgesRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{ROLE_LABELS[currentUser.role]}</Text>
                </View>

                {/* Verification Badge */}
                {isAuthenticated && (
                  <View style={[styles.verifyBadge, { backgroundColor: verificationInfo.color + '20' }]}>
                    <Ionicons name={verificationInfo.icon as any} size={12} color={verificationInfo.color} />
                    <Text style={[styles.verifyText, { color: verificationInfo.color }]}>
                      {verificationInfo.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{savedPropertiesCount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookmarkCount}</Text>
              <Text style={styles.statLabel}>Bookmarks</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {MENU_SECTIONS.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <GlassCard noPadding>
                {section.items.map((item, itemIndex) => {
                  let badgeText: string | undefined = (item as any).badge;
                  const badgeKey = (item as any).badgeKey;
                  if (badgeKey === 'myPlan') {
                    const extras = activeWorkspaces.filter((w) => w !== 'house_seeker');
                    badgeText = extras.length > 0 ? extras.map((w) => ACTIVE_WORKSPACE_BADGES[w]).join(' · ') : 'Free';
                  } else if (badgeKey) {
                    badgeText = dynamicBadges[badgeKey];
                  }
                  return (
                    <TouchableOpacity
                      key={itemIndex}
                      style={[
                        styles.menuItem,
                        itemIndex < section.items.length - 1 && styles.menuItemBorder,
                      ]}
                      onPress={() => {
                        const route = (item as any).route;
                        if (route) navigateToRoute(route);
                      }}
                    >
                      <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon as any} size={14} color={item.color} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      {badgeText && (
                        <View style={[styles.menuBadge, { backgroundColor: item.color + '20' }]}>
                          <Text style={[styles.menuBadgeText, { color: item.color }]}>{badgeText}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={13} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </GlassCard>
            </View>
          ))}
        </View>

        {/* HAMA Footer */}
      <View style={styles.footer}>
          <Text style={styles.footerBrand}>HAMA™</Text>
          <Text style={styles.footerVersion}>Version 2.1.0</Text>
          <Text style={styles.footerTagline}>Need a house homie? We've got you!</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: SPACING.lg,
  },
  avatarBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  roleText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.glassBorder,
  },
  settingIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 11,
  },
  settingDetail: {
    color: COLORS.textTertiary,
    fontSize: 8,
    marginTop: 1,
  },
  menuContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    color: COLORS.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: 8,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  menuIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11,
  },
  menuBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  menuBadgeText: {
    fontSize: 8,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: 4,
  },
  footerBrand: {
    ...FONTS.h3,
    color: COLORS.primary,
    fontWeight: '800',
  },
  footerVersion: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  footerTagline: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
});
