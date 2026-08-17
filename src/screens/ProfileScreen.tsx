import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useProfileBadges } from '../hooks/useUserData';
import { getCommunityPosts } from '../services/communityService';
import { ROLE_LABELS, VERIFICATION_LABELS } from '../constants/labels';
import { navigateToRoute } from '../utils/navigation';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const getMenuSections = (colors: ThemeColors) => [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', color: colors.primary, route: 'EditProfile' },
      { icon: 'bookmark-outline', label: 'Saved', color: colors.accent, route: 'Favorites' },
    ],
  },
  {
    title: 'Discover',
    items: [
      { icon: 'compass-outline', label: 'Discover', color: colors.primary, route: 'Blog' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { icon: 'notifications-outline', label: 'Notifications', color: colors.warning, route: 'Notifications' },
      { icon: 'chatbubble-outline', label: 'Messages', color: colors.primary, badgeKey: 'unreadMessages', route: 'Inbox' },
      { icon: 'chatbubble-outline', label: 'My Reviews', color: colors.warning, badgeKey: 'myReviews' },
      { icon: 'newspaper-outline', label: 'My Posts', color: colors.secondary, route: 'MyPosts' },
      { icon: 'time-outline', label: 'Booking History', color: colors.primary },
      { icon: 'cart-outline', label: 'Orders', color: colors.accent },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: 'settings-outline', label: 'Settings', color: colors.secondary, route: 'Settings' },
    ],
  },
];

export const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, isAuthenticated, isEmailVerified } = useAuth();
  const { dynamicBadges, savedPropertiesCount, reviewCount, bookmarkCount } = useProfileBadges();
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
        <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
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
        <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.profileInfo}>
            <LinearGradient colors={colors.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarBorder}>
              <UserAvatar uri={currentUser.avatar} size={82} style={styles.avatar} />
            </LinearGradient>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              {currentUser.username ? (
                <Text style={styles.profileUsername}>
                  <Text style={styles.atSign}>@</Text>
                  {currentUser.username}
                </Text>
              ) : null}

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
          {getMenuSections(colors).map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <GlassCard noPadding>
                {section.items.map((item, itemIndex) => {
                  let badgeText: string | undefined = (item as any).badge;
                  const badgeKey = (item as any).badgeKey;
                  if (badgeKey) {
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
                      <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
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
          <TouchableOpacity onPress={() => navigateToRoute('Blog')} style={styles.footerLink} activeOpacity={0.7}>
            <Text style={styles.footerLinkText}>Blog</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    marginBottom: SPACING.lg,
  },
  avatarBorder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileText: {
    alignItems: 'center',
  },
  profileName: {
    ...FONTS.h2,
    color: colors.text,
    textAlign: 'center',
  },
  profileUsername: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 2,
  },
  atSign: {
    color: colors.primary,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    color: colors.primaryLight,
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
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h2,
    color: colors.text,
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.glassBorder,
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
    color: colors.text,
    fontSize: 11,
  },
  settingDetail: {
    color: colors.textTertiary,
    fontSize: 8,
    marginTop: 1,
  },
  menuContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    color: colors.textTertiary,
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
    borderBottomColor: colors.glassBorder,
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
    color: colors.text,
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
    color: colors.primary,
    fontWeight: '800',
  },
  footerVersion: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  footerTagline: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  footerLink: {
    marginTop: SPACING.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
  },
  footerLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
