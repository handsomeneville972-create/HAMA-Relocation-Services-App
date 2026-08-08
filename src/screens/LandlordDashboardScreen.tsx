import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiquidGlass } from '../components/LiquidGlass';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatPrice } from '../utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_PADDING = 24;
const GAP = 16;
const KPI_CARD_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING - GAP) / 2;

const CHECKLIST_STORAGE_KEY = 'hama_landlord_checklist_v1';

type TabKey = 'overview' | 'properties' | 'bookings' | 'analytics';
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface KpiItem {
  label: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface BookingItem {
  id: string;
  property: string;
  tenant: string;
  date: string;
  amount: number;
  status: BookingStatus;
}

interface ReviewItem {
  id: string;
  property: string;
  tenant: string;
  rating: number;
  comment: string;
  date: string;
}

interface ChecklistItem {
  key: string;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  done: boolean;
}

interface OwnedProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  status: 'Occupied' | 'Available';
  furnished: boolean;
  image: string;
}

const KPI_DATA: KpiItem[] = [
  { label: 'Total Properties', value: '12', change: '+3', icon: 'business-outline', color: COLORS.primary },
  { label: 'Occupied', value: '8', change: '67%', icon: 'people-outline', color: COLORS.success },
  { label: 'Revenue (MTD)', value: 'KSh 420K', change: '+12%', icon: 'cash-outline', color: COLORS.warning },
  { label: 'Avg. Rating', value: '4.8', change: '+0.2', icon: 'star-outline', color: '#FFD700' },
];

const BOOKINGS: BookingItem[] = [
  { id: 'b1', property: '2BR in Kilimani', tenant: 'Jane M.', date: '28 Jun', amount: 55000, status: 'confirmed' },
  { id: 'b2', property: 'Studio in Westlands', tenant: 'Peter K.', date: '27 Jun', amount: 35000, status: 'pending' },
  { id: 'b3', property: '1BR in Lavington', tenant: 'Sarah W.', date: '25 Jun', amount: 45000, status: 'completed' },
  { id: 'b4', property: '3BR in Karen', tenant: 'David O.', date: '24 Jun', amount: 85000, status: 'cancelled' },
  { id: 'b5', property: '2BR in Westlands', tenant: 'Ann W.', date: '22 Jun', amount: 60000, status: 'confirmed' },
];

const REVIEWS: ReviewItem[] = [
  { id: 'r1', property: '2BR in Kilimani', tenant: 'Jane M.', rating: 5, comment: 'Beautiful apartment, very clean and secure. Landlord was responsive and helpful.', date: '2 days ago' },
  { id: 'r2', property: 'Studio in Westlands', tenant: 'Peter K.', rating: 4, comment: 'Great location, modern finishes. Minor issue with water pressure.', date: '5 days ago' },
  { id: 'r3', property: '1BR in Lavington', tenant: 'Sarah W.', rating: 5, comment: 'Exactly as described. Highly recommend!', date: '1 week ago' },
];

const SETUP_CHECKLIST: ChecklistItem[] = [
  { key: 'identity', label: 'Verify your identity', desc: 'Complete ID verification to unlock all landlord tools', icon: 'shield-checkmark-outline', done: false },
  { key: 'property', label: 'Add your first property', desc: 'Create a listing to start attracting tenants', icon: 'home-outline', done: false },
  { key: 'photos', label: 'Add property photos', desc: 'Listings with photos get 3x more views', icon: 'images-outline', done: false },
];

const OWNED_PROPERTIES: OwnedProperty[] = [
  { id: 'pr1', title: 'Modern 2-Bedroom Apartment', location: 'Westlands, Nairobi', price: 45000, status: 'Occupied', furnished: true, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' },
  { id: 'pr2', title: 'Cozy 1-Bedroom in Kilimani', location: 'Kilimani, Nairobi', price: 28000, status: 'Occupied', furnished: true, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600' },
  { id: 'pr3', title: 'Spacious 3-Bedroom House', location: 'Lavington, Nairobi', price: 85000, status: 'Available', furnished: false, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600' },
  { id: 'pr4', title: 'Student Studio near UoN', location: 'Ngara, Nairobi', price: 12000, status: 'Occupied', furnished: true, image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600' },
];

const BOOKING_STATUS: Record<BookingStatus, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { color: COLORS.warning, icon: 'time-outline' },
  confirmed: { color: COLORS.success, icon: 'checkmark-circle-outline' },
  completed: { color: COLORS.primary, icon: 'checkmark-done-outline' },
  cancelled: { color: COLORS.error, icon: 'close-circle-outline' },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'properties', label: 'Properties' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'analytics', label: 'Analytics' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
};

export const LandlordDashboardScreen: React.FC<{ navigation: any; firstRun?: boolean }> = ({ navigation, firstRun = false }) => {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabKey>('overview');
  const [showWelcome, setShowWelcome] = useState(firstRun);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(SETUP_CHECKLIST);
  const [bookingFilter, setBookingFilter] = useState<'all' | BookingStatus>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const kpiScale = useRef(KPI_DATA.map(() => new Animated.Value(0))).current;

  const firstName = currentUser?.name?.split(' ')[0] || 'Landlord';  const doneCount = checklist.filter((i) => i.done).length;
  const allChecklistDone = doneCount === checklist.length;
  const filteredBookings = bookingFilter === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === bookingFilter);

  // ---------- Load persisted checklist ----------
  useEffect(() => {
    AsyncStorage.getItem(CHECKLIST_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const doneKeys = JSON.parse(raw) as string[];
          setChecklist((prev) => prev.map((item) => ({ ...item, done: doneKeys.includes(item.key) })));
        }
      })
      .catch(() => {});
  }, []);

  // ---------- Entrance animations ----------
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (reducedMotion) {
        fadeAnim.setValue(1);
        kpiScale.forEach((a) => a.setValue(1));
        return;
      }
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Animated.stagger(80, kpiScale.map((a) => Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }))).start();
    }, 600);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (showWelcome && !reducedMotion) {
      Animated.spring(welcomeAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    }
  }, [showWelcome, reducedMotion]);

  // ---------- Interactions ----------
  const switchTab = (tab: TabKey) => {
    if (tab === selectedTab) return;
    setSelectedTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => {
      const updated = prev.map((item) => (item.key === key ? { ...item, done: !item.done } : item));
      AsyncStorage.setItem(
        CHECKLIST_STORAGE_KEY,
        JSON.stringify(updated.filter((i) => i.done).map((i) => i.key)),
      ).catch(() => {});
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const openProperty = (id: string) => navigation.navigate('PropertyDetail', { propertyId: id });

  // ---------- Render helpers ----------
  const renderKpiCard = (item: KpiItem, index: number) => (
    <Animated.View key={item.label} style={[styles.kpiCard, { opacity: kpiScale[index], transform: [{ scale: kpiScale[index] }] }]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${item.color}18` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={styles.kpiValue}>{item.value}</Text>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      <View style={[styles.kpiChange, { backgroundColor: `${COLORS.success}18` }]}>
        <Ionicons name="arrow-up" size={10} color={COLORS.success} />
        <Text style={styles.kpiChangeText}>{item.change}</Text>
      </View>
    </Animated.View>
  );

  const renderWelcomeBanner = () =>
    showWelcome ? (
      <Animated.View style={{ opacity: welcomeAnim, transform: [{ translateY: welcomeAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }}>
        <LiquidGlass variant="elevated" style={styles.welcomeBanner}>
          <TouchableOpacity style={styles.welcomeClose} onPress={() => setShowWelcome(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <View style={styles.welcomeIcon}>
            <Ionicons name="sparkles" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome to your Landlord Dashboard</Text>
            <Text style={styles.welcomeDesc}>Complete the quick setup checklist below to get your first property live and start receiving tenant inquiries.</Text>
          </View>
        </LiquidGlass>
      </Animated.View>
    ) : null;

  const renderSetupChecklist = () =>
    !allChecklistDone ? (
      <LiquidGlass variant="elevated" style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Set up your hosting</Text>
            <Text style={styles.checklistSub}>{checklist.length - doneCount} steps remaining to go live</Text>
          </View>
          <View style={styles.checklistProgress}>
            <Text style={styles.checklistProgressText}>{doneCount}/{checklist.length}</Text>
          </View>
        </View>
        <View style={styles.checklistTrack}>
          <View style={[styles.checklistFill, { width: `${(doneCount / checklist.length) * 100}%` }]} />
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
                <Ionicons name={item.icon} size={14} color={COLORS.primary} />
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
    ) : null;

  const renderVerificationBanner = () =>
    showVerificationBanner ? (
      <LiquidGlass variant="subtle" style={styles.verificationBanner}>
        <View style={styles.verificationIcon}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.verificationTitle}>Identity Verification In Progress</Text>
          <Text style={styles.verificationDesc}>Your documents are being reviewed. Some features are limited.</Text>
        </View>
        <TouchableOpacity onPress={() => setShowVerificationBanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </LiquidGlass>
    ) : null;

  const renderQuickActions = () => (
    <View style={styles.quickActionsRow}>
      <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('LandlordOnboarding')} activeOpacity={0.8}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.primary}18` }]}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.quickActionLabel}>Add Property</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Inbox')} activeOpacity={0.8}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.success}18` }]}>
          <Ionicons name="chatbubbles-outline" size={20} color={COLORS.success} />
        </View>
        <Text style={styles.quickActionLabel}>Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionBtn} onPress={() => switchTab('analytics')} activeOpacity={0.8}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.warning}18` }]}>
          <Ionicons name="bar-chart-outline" size={20} color={COLORS.warning} />
        </View>
        <Text style={styles.quickActionLabel}>Analytics</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRevenueChart = () => (
    <LiquidGlass variant="elevated" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up-outline" size={20} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <Text style={styles.sectionPeriod}>Last 30 days</Text>
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
  );

  const renderRecentBookings = () => (
    <LiquidGlass variant="elevated" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <TouchableOpacity onPress={() => switchTab('bookings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>
      {BOOKINGS.slice(0, 3).map((booking, i) => (
        <View key={booking.id} style={[styles.bookingRow, i < 2 && styles.rowBorder]}>
          <View style={styles.bookingAvatar}>
            <Text style={styles.bookingAvatarText}>{booking.tenant.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{booking.property}</Text>
            <Text style={styles.rowSub}>{booking.tenant} · {booking.date}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${BOOKING_STATUS[booking.status].color}15` }]}>
            <Ionicons name={BOOKING_STATUS[booking.status].icon} size={12} color={BOOKING_STATUS[booking.status].color} />
            <Text style={[styles.statusPillText, { color: BOOKING_STATUS[booking.status].color }]}>{booking.status}</Text>
          </View>
        </View>
      ))}
    </LiquidGlass>
  );

  const renderRecentReviews = () => (
    <LiquidGlass variant="elevated" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name="star-outline" size={20} color={COLORS.warning} />
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
      </View>
      {REVIEWS.slice(0, 2).map((review, i) => (
        <View key={review.id} style={[styles.reviewRow, i < 1 && styles.rowBorder]}>
          <View style={{ flex: 1 }}>
            <View style={styles.reviewTop}>
              <Text style={styles.rowTitle}>{review.property}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color="#FFD700" />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment} numberOfLines={2}>{review.comment}</Text>
            <Text style={styles.rowSub}>{review.tenant} · {review.date}</Text>
          </View>
        </View>
      ))}
    </LiquidGlass>
  );

  const renderOverviewTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderWelcomeBanner()}
      {renderSetupChecklist()}
      {renderVerificationBanner()}
      <View style={styles.kpiGrid}>{KPI_DATA.map((item, i) => renderKpiCard(item, i))}</View>
      {renderQuickActions()}
      {renderRevenueChart()}
      {renderRecentBookings()}
      {renderRecentReviews()}
    </Animated.View>
  );

  const renderPropertiesTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.addListingButton} onPress={() => navigation.navigate('LandlordOnboarding')} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
        <Text style={styles.addListingText}>Add New Property</Text>
      </TouchableOpacity>
      {OWNED_PROPERTIES.map((property) => (
        <TouchableOpacity key={property.id} style={styles.propertyCard} onPress={() => openProperty(property.id)} activeOpacity={0.85}>
          <Image source={{ uri: property.image }} style={styles.propertyImage} />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
            <Text style={styles.propertyLocation}>{property.location}</Text>
            <Text style={styles.propertyPrice}>{formatPrice(property.price)}/mo</Text>
            <View style={styles.metaRow}>
              <View style={[styles.metaPill, property.status === 'Occupied' ? styles.metaPillOccupied : styles.metaPillAvailable]}>
                <Text style={[styles.metaPillText, property.status === 'Occupied' ? { color: COLORS.success } : { color: COLORS.warning }]}>{property.status}</Text>
              </View>
              {property.furnished && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>Furnished</Text>
                </View>
              )}
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>Verified</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderBookingsTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, bookingFilter === status && styles.filterChipActive]}
            onPress={() => setBookingFilter(status)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, bookingFilter === status && styles.filterChipTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filteredBookings.length === 0 ? (
        <LiquidGlass variant="elevated" style={styles.emptyStateCard}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>No {bookingFilter} bookings</Text>
          <Text style={styles.emptyStateDesc}>Bookings with this status will appear here.</Text>
        </LiquidGlass>
      ) : (
        filteredBookings.map((booking) => (
          <LiquidGlass key={booking.id} variant="elevated" style={styles.bookingCard}>
            <View style={styles.bookingTop}>
              <View>
                <Text style={styles.bookingProperty}>{booking.property}</Text>
                <Text style={styles.bookingTenant}>{booking.tenant} · {booking.date}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${BOOKING_STATUS[booking.status].color}15` }]}>
                <Ionicons name={BOOKING_STATUS[booking.status].icon} size={13} color={BOOKING_STATUS[booking.status].color} />
                <Text style={[styles.statusPillText, { color: BOOKING_STATUS[booking.status].color }]}>{booking.status}</Text>
              </View>
            </View>
            <Text style={styles.bookingAmount}>{formatPrice(booking.amount)}</Text>
          </LiquidGlass>
        ))
      )}
    </Animated.View>
  );

  const renderAnalyticsTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <LiquidGlass variant="elevated" style={styles.sectionCard}>
        <Text style={styles.analyticsTitle}>Occupancy Rate</Text>
        <View style={styles.occupancyBar}>
          <View style={[styles.occupancyFill, { width: '67%' }]} />
        </View>
        <Text style={styles.analyticsValue}>67% · 8 of 12 properties occupied</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.sectionCard}>
        <Text style={styles.analyticsTitle}>Average Rent</Text>
        <Text style={styles.analyticsValue}>{formatPrice(52500)}/mo</Text>
        <Text style={styles.analyticsSub}>Across all properties</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.sectionCard}>
        <Text style={styles.analyticsTitle}>Reviews ({REVIEWS.length})</Text>
        {REVIEWS.map((review, i) => (
          <View key={review.id} style={[styles.reviewItem, i < REVIEWS.length - 1 && styles.reviewBorder]}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewProperty}>{review.property}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color={s <= review.rating ? '#FFD700' : COLORS.textTertiary} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment} numberOfLines={2}>{review.comment}</Text>
            <Text style={styles.reviewMeta}>{review.tenant} · {review.date}</Text>
          </View>
        ))}
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.sectionCard}>
        <Text style={styles.analyticsTitle}>Quick Stats</Text>
        {[
          { label: 'Total Views (MTD)', value: '2,847', icon: 'eye-outline' as const },
          { label: 'Inquiries (MTD)', value: '34', icon: 'chatbubble-outline' as const },
          { label: 'Avg. Days to Rent', value: '12 days', icon: 'time-outline' as const },
          { label: 'Listing Success Rate', value: '92%', icon: 'trending-up-outline' as const },
        ].map((stat, i) => (
          <View key={i} style={[styles.statRow, i < 3 && styles.rowBorder]}>
            <Ionicons name={stat.icon} size={16} color={COLORS.textTertiary} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </LiquidGlass>
    </Animated.View>
  );

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={COLORS.gradientNight} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Landlord Dashboard</Text>
              <Text style={styles.headerSubtitle}>Manage your properties, bookings, and revenue</Text>
            </View>
          </View>
          <View style={styles.tabBarSkeleton}>
            <SkeletonLoader type="text" style={{ width: 80 }} />
            <SkeletonLoader type="text" style={{ width: 90 }} />
            <SkeletonLoader type="text" style={{ width: 80 }} />
            <SkeletonLoader type="text" style={{ width: 90 }} />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SkeletonLoader type="detail-section" />
          <SkeletonLoader type="list" count={3} />
          <SkeletonLoader type="detail-section" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={COLORS.gradientNight} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.plansChip} onPress={() => navigation.navigate('LandlordPlans')} activeOpacity={0.8}>
            <Ionicons name="diamond-outline" size={14} color={COLORS.primary} />
            <Text style={styles.plansChipText}>Plans & Pricing</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
              onPress={() => switchTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  container: { flex: 1, backgroundColor: COLORS.gradientNight[0] },

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingLabel: { color: COLORS.textTertiary, fontSize: 11 },
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  headerSubtitle: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  plansChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}12`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
  },
  plansChipText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.bgElevated },
  tabText: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: COLORS.text, fontWeight: '700' },
  tabBarSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  // Content
  scrollContent: { padding: SPACING.lg },

  // Welcome
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  welcomeClose: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  welcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  welcomeDesc: { color: COLORS.textTertiary, fontSize: 12, marginTop: 3, lineHeight: 17 },

  // Checklist
  checklistCard: { padding: SPACING.lg, marginBottom: SPACING.md },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  checklistSub: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2 },
  checklistProgress: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
  },
  checklistProgressText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  checklistTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.bgCard, overflow: 'hidden', marginBottom: SPACING.sm },
  checklistFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 12,
  },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  checklistCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistCheckDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checklistItemLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  checklistItemLabelDone: { color: COLORS.textTertiary, textDecorationLine: 'line-through' },
  checklistItemDesc: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2 },

  // Verification banner
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.warning}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  verificationDesc: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2, lineHeight: 16 },

  // KPI
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    width: KPI_CARD_WIDTH,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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

  // Quick actions
  quickActionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  quickActionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },

  // Sections
  sectionCard: { padding: SPACING.lg, marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  sectionPeriod: { color: COLORS.textTertiary, fontSize: 11 },
  viewAllText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Chart
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 6,
    marginBottom: 8,
  },
  chartBarWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartLabels: { flexDirection: 'row', gap: 6 },
  chartLabel: { flex: 1, color: COLORS.textTertiary, fontSize: 8, textAlign: 'center' },

  // Rows
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 12,
  },
  bookingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingAvatarText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  rowTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  rowSub: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  // Reviews
  reviewRow: { paddingVertical: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 1 },
  reviewComment: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  reviewItem: { paddingVertical: 12 },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  reviewProperty: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  reviewMeta: { color: COLORS.textTertiary, fontSize: 11, marginTop: 4 },

  // Properties
  addListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  addListingText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
  },
  propertyImage: { width: 72, height: 72, borderRadius: RADIUS.md },
  propertyInfo: { flex: 1 },
  propertyTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  propertyLocation: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2 },
  propertyPrice: { color: COLORS.primary, fontSize: 13, fontWeight: '800', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
  },
  metaPillOccupied: { backgroundColor: `${COLORS.success}15` },
  metaPillAvailable: { backgroundColor: `${COLORS.warning}15` },
  metaPillText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },

  // Bookings
  filterScroll: { flexGrow: 0, marginBottom: SPACING.md },
  filterContent: { gap: 8, paddingRight: SPACING.md },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  bookingCard: { padding: SPACING.lg, marginBottom: SPACING.md },
  bookingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  bookingProperty: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  bookingTenant: { color: COLORS.textTertiary, fontSize: 11, marginTop: 2 },
  bookingAmount: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },

  // Analytics
  analyticsTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: SPACING.sm },
  analyticsValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  analyticsSub: { color: COLORS.textTertiary, fontSize: 11, marginTop: 4 },
  occupancyBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgCard,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  occupancyFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  statLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 13 },
  statValue: { color: COLORS.text, fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyStateCard: {
    alignItems: 'center',
    padding: SPACING.lg * 1.5,
    gap: SPACING.sm,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  emptyStateDesc: { color: COLORS.textTertiary, fontSize: 12, textAlign: 'center', lineHeight: 17 },
});
