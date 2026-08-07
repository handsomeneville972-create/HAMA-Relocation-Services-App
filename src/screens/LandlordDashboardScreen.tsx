import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LiquidGlass } from '../components/LiquidGlass';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.78;
const SIDEBAR_BG = '#000000';
const CARD_BG = '#121212';
const ACCENT = COLORS.primary;

interface SidebarItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'properties', label: 'My Properties', icon: 'home-outline' },
  { key: 'add_property', label: 'Add Property', icon: 'add-circle-outline' },
  { key: 'drafts', label: 'Drafts', icon: 'document-text-outline' },
  { key: 'bookings', label: 'Bookings & Viewings', icon: 'calendar-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubbles-outline' },
  { key: 'enquiries', label: 'Enquiries', icon: 'help-circle-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'bar-chart-outline' },
  { key: 'reviews', label: 'Reviews', icon: 'star-outline' },
  { key: 'plans', label: 'Plans & Pricing', icon: 'diamond-outline' },
  { key: 'earnings', label: 'Earnings', icon: 'cash-outline' },
  { key: 'verification', label: 'Verification', icon: 'shield-checkmark-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

const KPI_DATA = [
  { label: 'Total Properties', value: '12', change: '+3', icon: 'business-outline', color: ACCENT },
  { label: 'Occupied', value: '8', change: '67%', icon: 'people-outline', color: COLORS.success },
  { label: 'Revenue (MTD)', value: 'KSh 420K', change: '+12%', icon: 'cash-outline', color: COLORS.warning },
  { label: 'Avg. Rating', value: '4.8', change: '+0.2', icon: 'star-outline', color: '#FFD700' },
];

const TENANT_ACTIVITY = [
  { id: '1', name: 'Jane M.', action: 'Paid rent', property: '2BR Kilimani', time: '2h ago', amount: 'KSh 55,000' },
  { id: '2', name: 'Peter K.', action: 'Requested maintenance', property: 'Studio Westlands', time: '5h ago', amount: '' },
  { id: '3', name: 'Sarah W.', action: 'Renewed lease', property: '1BR Lavington', time: '1d ago', amount: 'KSh 45,000' },
  { id: '4', name: 'David O.', action: 'Viewed property', property: '3BR Karen', time: '2d ago', amount: '' },
];

export const LandlordDashboardScreen: React.FC<{ navigation: any; firstRun?: boolean }> = ({ navigation, firstRun = false }) => {
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(firstRun);

  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const kpiScale = useRef(KPI_DATA.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.stagger(80, kpiScale.map(a =>
      Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })
    )).start();
  }, []);

  const toggleSidebar = () => {
    const toValue = sidebarOpen ? 0 : 1;
    setSidebarOpen(!sidebarOpen);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue, friction: 8, tension: 100, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue, duration: 300, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSidebarItemPress = (key: string) => {
    toggleSidebar();
    if (key === 'add_property') {
      navigation.navigate('LandlordOnboarding');
    } else if (key === 'messages') {
      navigation.navigate('Inbox');
    } else if (key === 'settings') {
      navigation.navigate('Settings');
    } else {
      setActiveSection(key);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'maintenance': return COLORS.warning;
      case 'renewed': return COLORS.primary;
      default: return COLORS.textTertiary;
    }
  };

  const renderSidebar = () => {
    const translateX = sidebarAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-SIDEBAR_WIDTH, 0],
    });

    return (
      <>
        {/* Overlay */}
        <Animated.View
          style={[styles.sidebarOverlay, { opacity: overlayAnim }]}
          pointerEvents={sidebarOpen ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleSidebar} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
          <View style={[styles.sidebarHeader, { paddingTop: insets.top + 12 }]}>
            {/* Logo only — no text */}
            <View style={styles.logoWrap}>
              <LinearGradient colors={[ACCENT, '#FF9500']} style={styles.logoGradient}>
                <Text style={styles.logoText}>H</Text>
              </LinearGradient>
            </View>
            <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                  onPress={() => handleSidebarItemPress(item.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? ACCENT : COLORS.textSecondary}
                  />
                  <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </>
    );
  };

  const renderKPICard = (item: typeof KPI_DATA[0], index: number) => (
    <Animated.View
      key={index}
      style={[styles.kpiCard, { opacity: kpiScale[index], transform: [{ scale: kpiScale[index] }] }]}
    >
      <View style={[styles.kpiIcon, { backgroundColor: `${item.color}18` }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <Text style={styles.kpiValue}>{item.value}</Text>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      <View style={[styles.kpiChange, { backgroundColor: `${COLORS.success}18` }]}>
        <Ionicons name="arrow-up" size={10} color={COLORS.success} />
        <Text style={styles.kpiChangeText}>{item.change}</Text>
      </View>
    </Animated.View>
  );

  const renderTenantActivity = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={20} color={ACCENT} />
        <Text style={styles.sectionTitle}>Tenant Activity</Text>
        <TouchableOpacity style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Live</Text>
        </TouchableOpacity>
      </View>
      {TENANT_ACTIVITY.map((item, i) => (
        <View key={item.id} style={[styles.activityRow, i < TENANT_ACTIVITY.length - 1 && styles.activityBorder]}>
          <View style={[styles.activityAvatar, { backgroundColor: `${getStatusColor(item.action.includes('Paid') ? 'paid' : item.action.includes('maintenance') ? 'maintenance' : 'renewed')}20` }]}>
            <Text style={styles.activityAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityAction}>{item.action} · {item.property}</Text>
          </View>
          <View style={styles.activityRight}>
            {item.amount ? <Text style={styles.activityAmount}>{item.amount}</Text> : null}
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderRecentInteractions = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color={ACCENT} />
        <Text style={styles.sectionTitle}>Recent Interactions</Text>
      </View>
      {[
        { icon: 'chatbubble-outline', text: 'New enquiry from Peter K. about Studio Westlands', time: '3h ago' },
        { icon: 'document-text-outline', text: 'Lease agreement signed by Sarah W.', time: '1d ago' },
        { icon: 'warning-outline', text: 'Maintenance request: plumbing in 3BR Karen', time: '2d ago' },
      ].map((item, i) => (
        <View key={i} style={[styles.interactionRow, i < 2 && styles.activityBorder]}>
          <View style={styles.interactionIcon}>
            <Ionicons name={item.icon as any} size={16} color={COLORS.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.interactionText}>{item.text}</Text>
            <Text style={styles.interactionTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSidebar()}

      {/* Main Content */}
      <View style={[styles.main, { paddingTop: insets.top }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.hamburgerBtn}>
            <Ionicons name="menu" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingLabel}>Good afternoon,</Text>
            <Text style={styles.greetingName}>Landlord</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: contentFade }}>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              {KPI_DATA.map((item, i) => renderKPICard(item, i))}
            </View>

            {/* Tenant Activity */}
            {renderTenantActivity()}

            {/* Recent Interactions */}
            {renderRecentInteractions()}

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('LandlordOnboarding')}
              >
                <Ionicons name="add-circle-outline" size={22} color={ACCENT} />
                <Text style={styles.quickActionLabel}>Add Property</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Inbox')}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={ACCENT} />
                <Text style={styles.quickActionLabel}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => setActiveSection('analytics')}
              >
                <Ionicons name="bar-chart-outline" size={22} color={ACCENT} />
                <Text style={styles.quickActionLabel}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  main: { flex: 1, backgroundColor: SIDEBAR_BG },

  // Sidebar
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  sidebarCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarScroll: { flex: 1, paddingTop: SPACING.md },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  sidebarItemActive: {
    backgroundColor: `${ACCENT}12`,
  },
  sidebarLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: ACCENT,
    fontWeight: '700',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  greetingWrap: { flex: 1 },
  greetingLabel: { color: COLORS.textTertiary, fontSize: 12 },
  greetingName: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },

  // Content
  scrollContent: { padding: SPACING.lg },

  // KPI
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  kpiLabel: { color: COLORS.textTertiary, fontSize: 11, marginBottom: 6 },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  kpiChangeText: { color: COLORS.success, fontSize: 10, fontWeight: '700' },

  // Sections
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.success}18`,
  },
  sectionBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: '700' },

  // Activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  activityAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityAvatarText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  activityInfo: { flex: 1 },
  activityName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  activityAction: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { color: ACCENT, fontSize: 13, fontWeight: '700' },
  activityTime: { color: COLORS.textTertiary, fontSize: 10, marginTop: 2 },

  // Interactions
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  interactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  interactionText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  interactionTime: { color: COLORS.textTertiary, fontSize: 10, marginTop: 4 },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  quickActionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
});
