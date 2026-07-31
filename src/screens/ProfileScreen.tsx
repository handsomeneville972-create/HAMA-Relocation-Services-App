import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { EarlyAccessBadge } from '../components/EarlyAccessBadge';
import { ReferralProgram } from '../components/ReferralProgram';
import { EmailCaptureForm } from '../components/EmailCaptureForm';
import { useAuth } from '../contexts/AuthContext';
import { useProfileBadges } from '../hooks/useUserData';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { getCommunityPosts } from '../services/communityService';
import { ROLE_LABELS, VERIFICATION_LABELS } from '../constants/labels';
import { navigateToRoute } from '../utils/navigation';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', color: COLORS.primary, route: 'EditProfile' },
      { icon: 'location-outline', label: 'Saved Properties', color: COLORS.accent, badgeKey: 'savedProperties', route: 'Favorites' },
      { icon: 'heart-outline', label: 'Saved Products', color: COLORS.secondary, badgeKey: 'savedProducts', route: 'Favorites' },
      { icon: 'bookmark-outline', label: 'Saved Posts', color: COLORS.warning, badgeKey: 'savedPosts', route: 'Favorites' },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      { icon: 'diamond-outline', label: 'My Plan', color: COLORS.primary, badge: 'Free', route: 'WorkspacePlans' },
      { icon: 'card-outline', label: 'Payment Methods', color: COLORS.accent, route: 'PaymentMethods' },
      { icon: 'receipt-outline', label: 'Billing History', color: COLORS.textSecondary, route: 'BillingHistory' },
    ],
  },
  {
    title: 'Hosting',
    items: [
      { icon: 'add-circle-outline', label: 'List a Property', color: COLORS.primary, route: 'LandlordOnboarding' },
      { icon: 'home-outline', label: 'Landlord Dashboard', color: COLORS.accent, route: 'LandlordDashboard' },
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
      { icon: 'help-circle-outline', label: 'Help & Support', color: COLORS.primary },
      { icon: 'information-circle-outline', label: 'About HAMA', color: COLORS.textSecondary, route: 'About' },
    ],
  },
];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, isAuthenticated, isEmailVerified } = useAuth();
  const { dynamicBadges, savedPropertiesCount, reviewCount, bookmarkCount } = useProfileBadges();
  const { showWaitlist } = useEarlyAccess();
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadPostCount = async () => {
      if (!currentUserId) return;
      const { data } = await getCommunityPosts({ userId: currentUserId });
      if (active && data) setPostCount(data.length);
    };
    loadPostCount();
    return () => {
      active = false;
    };
  }, [currentUserId]);

  // Get verification badge info
  const verificationInfo = VERIFICATION_LABELS[currentUser.verificationLevel] ?? VERIFICATION_LABELS.unverified;

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

                {/*                  Verification Badge */}
                {isAuthenticated && (
                  <View style={[styles.verifyBadge, { backgroundColor: verificationInfo.color + '20' }]}>
                    <Ionicons name={verificationInfo.icon as any} size={12} color={verificationInfo.color} />
                    <Text style={[styles.verifyText, { color: verificationInfo.color }]}>
                      {verificationInfo.label}
                    </Text>
                  </View>
                )}

                {/* Early Access Badge */}
                <EarlyAccessBadge variant="compact" />
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

        {/* Early Access: Join Priority Access + Referral Program */}
        <View style={styles.engagementContainer}>
          <TouchableOpacity style={styles.priorityAccessBtn} onPress={showWaitlist}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityAccessBtnGrad}
            >
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.priorityAccessBtnText}>
                <Text style={styles.priorityAccessBtnTitle}>Priority Access List</Text>
                <Text style={styles.priorityAccessBtnDesc}>Be first to know when subscriptions launch</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <ReferralProgram />

          <EmailCaptureForm compact message="Get product updates, new features, and exclusive launch announcements." />
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {MENU_SECTIONS.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <GlassCard noPadding>
                {section.items.map((item, itemIndex) => {
                  const badgeText = (item as any).badgeKey
                    ? dynamicBadges[(item as any).badgeKey]
                    : (item as any).badge;
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
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      {badgeText && (
                        <View style={[styles.menuBadge, { backgroundColor: item.color + '20' }]}>
                          <Text style={[styles.menuBadgeText, { color: item.color }]}>{badgeText}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 15,
  },
  settingDetail: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  // Engagement section
  engagementContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 12,
    marginTop: SPACING.sm,
  },
  priorityAccessBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  priorityAccessBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.lg,
  },
  priorityAccessBtnText: {
    flex: 1,
  },
  priorityAccessBtnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  priorityAccessBtnDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  menuBadgeText: {
    fontSize: 12,
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
