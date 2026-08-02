import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiquidGlass } from '../components/LiquidGlass';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const CHECKLIST_STORAGE_KEY = 'hama_landlord_checklist_v1';

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface BookingData {
  id: string;
  property: string;
  tenant: string;
  date: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface ReviewData {
  id: string;
  property: string;
  tenant: string;
  rating: number;
  comment: string;
  date: string;
}

interface SetupChecklistItem {
  key: string;
  label: string;
  desc: string;
  icon: string;
  done: boolean;
}

const METRICS: DashboardMetric[] = [
  { label: 'Total Properties', value: '12', change: '+3', changeType: 'positive', icon: 'business-outline', color: COLORS.primary },
  { label: 'Occupied', value: '8', change: '67%', changeType: 'positive', icon: 'people-outline', color: COLORS.success },
  { label: 'Revenue (MTD)', value: 'KSh 420K', change: '+12%', changeType: 'positive', icon: 'cash-outline', color: COLORS.warning },
  { label: 'Avg. Rating', value: '4.8', change: '+0.2', changeType: 'positive', icon: 'star-outline', color: '#FFD700' },
];

const RECENT_BOOKINGS: BookingData[] = [
  { id: '1', property: '2BR in Kilimani', tenant: 'Jane M.', date: '2026-06-28', amount: 'KSh 55,000', status: 'confirmed' },
  { id: '2', property: 'Studio in Westlands', tenant: 'Peter K.', date: '2026-06-27', amount: 'KSh 35,000', status: 'pending' },
  { id: '3', property: '1BR in Lavington', tenant: 'Sarah W.', date: '2026-06-25', amount: 'KSh 45,000', status: 'completed' },
  { id: '4', property: '3BR in Karen', tenant: 'David O.', date: '2026-06-24', amount: 'KSh 85,000', status: 'cancelled' },
];

const RECENT_REVIEWS: ReviewData[] = [
  { id: '1', property: '2BR in Kilimani', tenant: 'Jane M.', rating: 5, comment: 'Beautiful apartment, very clean and secure. Landlord was responsive and helpful.', date: '2 days ago' },
  { id: '2', property: 'Studio in Westlands', tenant: 'Peter K.', rating: 4, comment: 'Great location, modern finishes. Minor issue with water pressure.', date: '5 days ago' },
  { id: '3', property: '1BR in Lavington', tenant: 'Sarah W.', rating: 5, comment: 'Exactly as described. Highly recommend!', date: '1 week ago' },
];

const SETUP_CHECKLIST: SetupChecklistItem[] = [
  { key: 'identity', label: 'Verify your identity', desc: 'Complete ID verification to unlock all landlord tools', icon: 'shield-checkmark-outline', done: false },
  { key: 'property', label: 'Add your first property', desc: 'Create a listing to start attracting tenants', icon: 'home-outline', done: false },
  { key: 'photos', label: 'Add property photos', desc: 'Listings with photos get 3x more views', icon: 'images-outline', done: false },
];

export const LandlordDashboardScreen: React.FC<{ navigation: any; firstRun?: boolean }> = ({ navigation, firstRun = false }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'properties' | 'bookings' | 'analytics'>('overview');
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [showWelcome, setShowWelcome] = useState(firstRun);
  const [checklist, setChecklist] = useState<SetupChecklistItem[]>(SETUP_CHECKLIST);
  const [hasProperties, setHasProperties] = useState(true);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const metricScale = useRef(METRICS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showWelcome) {
      Animated.spring(welcomeAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    }
  }, [showWelcome]);

  useEffect(() => {
    if (!isLoading) {
      Animated.stagger(80, metricScale.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })
      )).start();
    }
  }, [isLoading]);

  useEffect(() => {
    AsyncStorage.getItem(CHECKLIST_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const doneKeys = JSON.parse(raw) as string[];
          setChecklist(prev => prev.map(item => ({ ...item, done: doneKeys.includes(item.key) })));
        }
      })
      .catch(() => {});
  }, []);

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => item.key === key ? { ...item, done: !item.done } : item);
      AsyncStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated.filter(i => i.done).map(i => i.key))).catch(() => {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return updated;
    });
  };

  const allChecklistDone = checklist.every(item => item.done);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'completed': return COLORS.primary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textTertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time-outline';
      case 'completed': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingHeader}>
          <SkeletonLoader type="text" style={{ width: 200, height: 28 }} />
          <SkeletonLoader type="text" style={{ width: 140, height: 16, marginTop: 8 }} />
        </View>
        <View style={styles.loadingBody}>
          {[0, 1, 2, 3].map(i => (
            <SkeletonLoader key={i} type="liquid-card" style={{ height: 100, marginBottom: SPACING.md }} />
          ))}
        </View>
      </View>
    );
  }

  const renderMetricCard = (metric: DashboardMetric, index: number) => (
    <Animated.View
      key={index}
      style={{
        width: (width - SPACING.lg * 2 - SPACING.md) / 2,
        opacity: metricScale[index],
        transform: [{ scale: metricScale[index] }],
      }}
    >
      <LiquidGlass variant="elevated" style={styles.metricCard}>
        <View style={[styles.metricIcon, { backgroundColor: `${metric.color}15` }]}>
          <Ionicons name={metric.icon as any} size={22} color={metric.color} />
        </View>
        <Text style={styles.metricValue}>{metric.value}</Text>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <View style={[styles.metricChange, { backgroundColor: metric.changeType === 'positive' ? 'rgba(0,212,170,0.15)' : 'rgba(255,77,106,0.15)' }]}>
          <Ionicons name={metric.changeType === 'positive' ? 'arrow-up' : 'arrow-down'} size={10} color={metric.changeType === 'positive' ? COLORS.success : COLORS.error} />
          <Text style={[styles.metricChangeText, { color: metric.changeType === 'positive' ? COLORS.success : COLORS.error }]}>{metric.change}</Text>
        </View>
      </LiquidGlass>
    </Animated.View>
  );

  const renderWelcomeBanner = () => (
    showWelcome ? (
      <Animated.View style={{ opacity: welcomeAnim, transform: [{ translateY: welcomeAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }}>
        <LinearGradient colors={['#1A1A1D', '#252528']} style={styles.welcomeBanner}>
          <TouchableOpacity style={styles.welcomeClose} onPress={() => setShowWelcome(false)}>
            <Ionicons name="close" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <View style={styles.welcomeIcon}>
            <Ionicons name="sparkles" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome to your Landlord Dashboard</Text>
          <Text style={styles.welcomeDesc}>Complete the quick setup checklist below to get your first property live and start receiving tenant inquiries.</Text>
        </LinearGradient>
      </Animated.View>
    ) : null
  );

  const renderSetupChecklist = () => (
    !allChecklistDone ? (
      <LiquidGlass variant="elevated" style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <View>
            <Text style={styles.checklistTitle}>Set up your hosting</Text>
            <Text style={styles.checklistSub}>{checklist.filter(i => !i.done).length} steps remaining to go live</Text>
          </View>
          <View style={styles.checklistProgress}>
            <Text style={styles.checklistProgressText}>
              {checklist.filter(i => i.done).length}/{checklist.length}
            </Text>
          </View>
        </View>
        <View style={styles.checklistTrack}>
          <View
            style={[
              styles.checklistFill,
              { width: `${(checklist.filter(i => i.done).length / checklist.length) * 100}%` },
            ]}
          />
        </View>
        {checklist.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.checklistItem, i < checklist.length - 1 && styles.checklistItemBorder]}
            onPress={() => toggleChecklistItem(item.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.checklistCheck, item.done && styles.checklistCheckDone]}>
              {item.done ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Ionicons name={item.icon as any} size={14} color={COLORS.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.checklistItemLabel, item.done && styles.checklistItemLabelDone]}>{item.label}</Text>
              <Text style={styles.checklistItemDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </LiquidGlass>
    ) : null
  );

  const renderPropertiesEmptyState = () => (
    <LiquidGlass variant="elevated" style={styles.emptyStateCard}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="home-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>No properties yet</Text>
      <Text style={styles.emptyStateDesc}>List your first property to start attracting tenants and tracking revenue.</Text>
      <TouchableOpacity style={styles.emptyStateBtn} onPress={() => navigation.navigate('LandlordOnboarding')}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.emptyStateBtnText}>List your first property</Text>
      </TouchableOpacity>
    </LiquidGlass>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {(['overview', 'properties', 'bookings', 'analytics'] as const).map(tab => (
        <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.tabActive]} onPress={() => setSelectedTab(tab)}>
          <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderVerificationBanner = () => (
    showVerificationBanner ? (
      <LiquidGlass variant="subtle" style={styles.verificationBanner}>
        <View style={styles.verificationContent}>
          <View style={styles.verificationIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.verificationText}>
            <Text style={styles.verificationTitle}>Identity Verification In Progress</Text>
            <Text style={styles.verificationDesc}>Your documents are being reviewed. Some features are limited.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowVerificationBanner(false)}>
            <Ionicons name="close" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </LiquidGlass>
    ) : null
  );

  const renderOverviewTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderWelcomeBanner()}
      {renderSetupChecklist()}
      {renderVerificationBanner()}
      <View style={styles.metricsGrid}>
        {METRICS.map((metric, index) => renderMetricCard(metric, index))}
      </View>
      <LiquidGlass variant="elevated" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue Overview</Text>
          <Text style={styles.chartPeriod}>Last 30 days</Text>
        </View>
        <View style={styles.chartBars}>
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 50].map((h, i) => (
            <View key={i} style={styles.chartBarWrapper}>
              <View style={[styles.chartBar, { height: `${h}%`, backgroundColor: i % 2 === 0 ? COLORS.primary : `${COLORS.primary}60` }]} />
            </View>
          ))}
        </View>
        <View style={styles.chartLabels}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
            <Text key={i} style={styles.chartLabel}>{m}</Text>
          ))}
        </View>
      </LiquidGlass>
      <View style={styles.sectionRow}>
        <LiquidGlass variant="elevated" style={styles.halfCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Chats</Text>
          </View>
          <Text style={styles.halfCardValue}>5</Text>
          <Text style={styles.halfCardLabel}>Unread messages from 3 tenants</Text>
          <TouchableOpacity style={styles.halfCardButton} onPress={() => navigation.navigate('Inbox')}>
            <Text style={styles.halfCardButtonText}>Open Messages</Text>
          </TouchableOpacity>
        </LiquidGlass>
        <LiquidGlass variant="elevated" style={styles.halfCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="newspaper-outline" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Subscription</Text>
          </View>
          <Text style={styles.halfCardValue}>Premium</Text>
          <Text style={styles.halfCardLabel}>Renews in 23 days · KSh 2,999/mo</Text>
          <TouchableOpacity style={styles.halfCardButton}>
            <Text style={styles.halfCardButtonText}>Manage Plan</Text>
          </TouchableOpacity>
        </LiquidGlass>
      </View>
    </Animated.View>
  );

  const renderPropertiesTab = () => (
    <View style={{ gap: SPACING.md }}>
      <TouchableOpacity style={styles.addListingButton} onPress={() => navigation.navigate('LandlordOnboarding')}>
        <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
        <Text style={styles.addListingText}>Add New Property</Text>
      </TouchableOpacity>
      {!hasProperties && renderPropertiesEmptyState()}
      {[1, 2, 3].map(i => (
        <LiquidGlass key={i} variant="elevated" style={styles.propertyListItem}>
          <View style={styles.propertyListImage} />
          <View style={styles.propertyListInfo}>
            <Text style={styles.propertyListTitle}>2BR Apartment in Kilimani</Text>
            <Text style={styles.propertyListSub}>KSh 55,000/mo · 85 sqm · 2 baths</Text>
            <View style={styles.propertyListMeta}>
              <View style={styles.metaPill}><Text style={styles.metaPillText}>Occupied</Text></View>
              <View style={styles.metaPill}><Text style={styles.metaPillText}>Furnished</Text></View>
              <View style={styles.metaPill}><Text style={styles.metaPillText}>Verified</Text></View>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </LiquidGlass>
      ))}
    </View>
  );

  const renderBookingsTab = () => (
    <View style={{ gap: SPACING.md }}>
      {RECENT_BOOKINGS.map(booking => (
        <LiquidGlass key={booking.id} variant="elevated" style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <View>
              <Text style={styles.bookingProperty}>{booking.property}</Text>
              <Text style={styles.bookingTenant}>{booking.tenant}</Text>
            </View>
            <View style={[styles.bookingStatus, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
              <Ionicons name={getStatusIcon(booking.status) as any} size={14} color={getStatusColor(booking.status)} />
              <Text style={[styles.bookingStatusText, { color: getStatusColor(booking.status) }]}>{booking.status}</Text>
            </View>
          </View>
          <View style={styles.bookingBottom}>
            <Text style={styles.bookingAmount}>{booking.amount}</Text>
            <Text style={styles.bookingDate}>{booking.date}</Text>
          </View>
        </LiquidGlass>
      ))}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={{ gap: SPACING.md }}>
      <LiquidGlass variant="elevated" style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Occupancy Rate</Text>
        <View style={styles.occupancyBar}>
          <View style={[styles.occupancyFill, { width: '67%' }]} />
        </View>
        <Text style={styles.analyticsValue}>67% · 8 of 12 properties occupied</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Average Rent</Text>
        <Text style={styles.analyticsValue}>KSh 52,500/mo</Text>
        <Text style={styles.analyticsSub}>Across all properties</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Reviews ({RECENT_REVIEWS.length})</Text>
        {RECENT_REVIEWS.map((review, i) => (
          <View key={review.id} style={[styles.reviewItem, i < RECENT_REVIEWS.length - 1 && styles.reviewBorder]}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewProperty}>{review.property}</Text>
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons key={s} name="star" size={12} color={s <= review.rating ? '#FFD700' : COLORS.textTertiary} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment} numberOfLines={2}>{review.comment}</Text>
            <Text style={styles.reviewMeta}>{review.tenant} · {review.date}</Text>
          </View>
        ))}
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Quick Stats</Text>
        {[
          { label: 'Total Views (MTD)', value: '2,847', icon: 'eye-outline' },
          { label: 'Inquiries (MTD)', value: '34', icon: 'chatbubble-outline' },
          { label: 'Avg. Days to Rent', value: '12 days', icon: 'time-outline' },
          { label: 'Listing Success Rate', value: '92%', icon: 'trending-up-outline' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statRow, i < 3 && styles.statBorder]}>
            <Ionicons name={stat.icon as any} size={16} color={COLORS.textTertiary} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </LiquidGlass>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A0A0F']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Landlord Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your properties, bookings, and revenue</Text>
          </View>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        {renderTabBar()}
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'properties' && renderPropertiesTab()}
        {selectedTab === 'bookings' && renderBookingsTab()}
        {selectedTab === 'analytics' && renderAnalyticsTab()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingHeader: { padding: SPACING.lg, marginBottom: SPACING.xl },
  loadingBody: { paddingHorizontal: SPACING.lg },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  headerTitle: { ...FONTS.h1, color: COLORS.text, marginBottom: 4 },
  headerSubtitle: { ...FONTS.caption, color: COLORS.textSecondary },
  settingsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.lg },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.full, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.full, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textTertiary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  verificationBanner: { borderRadius: RADIUS.md, marginBottom: SPACING.md },
  verificationContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  verificationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,184,77,0.15)', justifyContent: 'center', alignItems: 'center' },
  verificationText: { flex: 1 },
  verificationTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  verificationDesc: { color: COLORS.textTertiary, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md },
  metricCard: { width: (width - SPACING.lg * 2 - SPACING.md) / 2, borderRadius: RADIUS.md, padding: SPACING.md },
  metricIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { ...FONTS.h2, color: COLORS.text, marginBottom: 2 },
  metricLabel: { color: COLORS.textTertiary, fontSize: 11, marginBottom: 4 },
  metricChange: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  metricChangeText: { fontSize: 10, fontWeight: '600' },
  chartCard: { borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  chartTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  chartPeriod: { color: COLORS.textTertiary, fontSize: 12 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 8 },
  chartBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { color: COLORS.textTertiary, fontSize: 8, flex: 1, textAlign: 'center' },
  sectionRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  halfCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  halfCardValue: { ...FONTS.h3, color: COLORS.text, marginBottom: 4 },
  halfCardLabel: { color: COLORS.textTertiary, fontSize: 11, marginBottom: SPACING.sm },
  halfCardButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  halfCardButtonText: { color: COLORS.text, fontSize: 12, fontWeight: '500' },
  addListingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)' },
  addListingText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  propertyListItem: { flexDirection: 'row', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md, alignItems: 'center' },
  propertyListImage: { width: 64, height: 64, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,107,0,0.2)' },
  propertyListInfo: { flex: 1 },
  propertyListTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  propertyListSub: { color: COLORS.textTertiary, fontSize: 12, marginBottom: 6 },
  propertyListMeta: { flexDirection: 'row', gap: 4 },
  metaPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.06)' },
  metaPillText: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '500' },
  bookingCard: { borderRadius: RADIUS.md, padding: SPACING.md },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  bookingProperty: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  bookingTenant: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  bookingStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  bookingStatusText: { fontSize: 11, fontWeight: '600' },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingAmount: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  bookingDate: { color: COLORS.textTertiary, fontSize: 12 },
  analyticsCard: { borderRadius: RADIUS.md, padding: SPACING.lg },
  analyticsTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
  analyticsValue: { color: COLORS.primary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  analyticsSub: { color: COLORS.textTertiary, fontSize: 12 },
  occupancyBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: SPACING.md },
  occupancyFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  reviewItem: { paddingVertical: SPACING.md },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewProperty: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  reviewRating: { flexDirection: 'row', gap: 2 },
  reviewComment: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  reviewMeta: { color: COLORS.textTertiary, fontSize: 11 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  statBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  statLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 13 },
  statValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },

  // Welcome banner
  welcomeBanner: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  welcomeClose: { position: 'absolute', top: 12, right: 12, zIndex: 2, padding: 4 },
  welcomeIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  welcomeTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  welcomeDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },

  // Setup checklist
  checklistCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  checklistTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  checklistSub: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  checklistProgress: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,107,0,0.12)',
  },
  checklistProgressText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  checklistTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: SPACING.sm, overflow: 'hidden' },
  checklistFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  checklistCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  checklistCheckDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checklistItemLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  checklistItemLabelDone: { color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  checklistItemDesc: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },

  // Empty state
  emptyStateCard: { borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md },
  emptyStateIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyStateDesc: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: SPACING.lg },
  emptyStateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  emptyStateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
