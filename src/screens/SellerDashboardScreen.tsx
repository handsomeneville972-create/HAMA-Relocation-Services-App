import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useProvider } from '../contexts/ProviderContext';
import { PROVIDER_PLANS } from '../services/providerOnboardingService';
import {
  CustomerRecord,
  JobItem,
  QuoteRequest,
  WalletTransaction,
} from '../constants/types';
import { formatPrice } from '../utils/currency';

interface Props {
  navigation: any;
}

type TabKey = 'overview' | 'jobs' | 'quotes' | 'customers' | 'wallet';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'pulse-outline' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
  { key: 'quotes', label: 'Quotes', icon: 'document-text-outline' },
  { key: 'customers', label: 'Customers', icon: 'people-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
];

function CountUp({ value, duration = 900, prefix = '', suffix = '', format }: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percent' | 'rating';
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [value, duration, anim]);
  const formatted =
    format === 'currency'
      ? formatPrice(display)
      : format === 'percent'
        ? `${display}%`
        : format === 'rating'
          ? display.toFixed(1)
          : display.toLocaleString();
  return (
    <Text style={styles.kpiValue}>
      {prefix}{formatted}{suffix}
    </Text>
  );
}

export const SellerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { provider, isProvider, getDashboardData, logoutProvider } = useProvider();
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const data = useMemo(() => (provider ? getDashboardData() : null), [provider, getDashboardData]);

  useEffect(() => {
    if (isProvider && data) {
      setJobs(data.jobs);
      setQuotes(data.quotes);
    }
  }, [isProvider, data]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => clearTimeout(t);
  }, [fadeAnim]);

  const completionPct = useMemo(() => {
    if (!provider) return 0;
    const total = 10;
    const done = provider.completedSteps.length;
    return Math.round((done / total) * 100);
  }, [provider]);

  const moveJob = useCallback((id: string, direction: 'up' | 'down') => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const order: JobItem['status'][] = ['new', 'in_progress', 'completed'];
        const idx = order.indexOf(j.status);
        const next = direction === 'up' ? Math.min(order.length - 1, idx + 1) : Math.max(0, idx - 1);
        return { ...j, status: order[next] };
      })
    );
  }, []);

  const setQuoteStatus = useCallback((id: string, status: QuoteRequest['status']) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  }, []);

  // ---------- Upsell state (not a provider) ----------
  const [plan, setPlan] = useState<'Basic' | 'Premium'>('Basic');

  if (!isProvider || !provider || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
        <View style={styles.upsellHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.upsellTitle}>Seller Dashboard</Text>
        </View>
        <ScrollView contentContainerStyle={styles.upsellContent} showsVerticalScrollIndicator={false}>
          <View style={styles.upsellHero}>
            <LinearGradient colors={['rgba(255,107,0,0.25)', 'rgba(255,107,0,0.05)']} style={styles.upsellIconWrap}>
              <Ionicons name="storefront" size={40} color={COLORS.primary} />
            </LinearGradient>
            <Text style={styles.upsellHeading}>Grow your business on HAMA</Text>
            <Text style={styles.upsellBody}>
              Create a professional storefront, get found in search, manage jobs, quotes, customers and payouts — all in one place.
            </Text>
            <View style={styles.upsellPoints}>
              {['Public business profile', 'Search ranking & analytics', 'Quotes, jobs & customer CRM', 'Wallet & weekly payouts'].map((p) => (
                <View key={p} style={styles.upsellPoint}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.upsellPointText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
          {(['Basic', 'Premium'] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPlan(p)} style={[styles.planCard, plan === p && styles.planCardActive]}>
              <View style={{ flex: 1 }}>
                <View style={styles.planNameRow}>
                  <Ionicons name={p === 'Premium' ? 'diamond' : 'sparkles'} size={16} color={plan === p ? '#000' : COLORS.primary} />
                  <Text style={[styles.planName, plan === p && { color: '#000' }]}>{p}</Text>
                </View>
                <Text style={[styles.planPrice, plan === p && { color: '#000' }]}>
                  {formatPrice(PROVIDER_PLANS[p].price)}<Text style={[styles.planPeriod, plan === p && { color: '#000' }]}>{PROVIDER_PLANS[p].period}</Text>
                </Text>
                {PROVIDER_PLANS[p].features.slice(0, 3).map((f) => (
                  <View key={f} style={styles.planFeatureRow}>
                    <Ionicons name="checkmark-circle" size={12} color={plan === p ? '#000' : COLORS.success} />
                    <Text style={[styles.planFeature, plan === p && { color: '#000' }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <Ionicons name={plan === p ? 'radio-button-on' : 'radio-button-off'} size={20} color={plan === p ? '#000' : COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.upsellCta} onPress={() => navigation.navigate(`ServiceProviderOnboarding?plan=${plan}`)}>
            <Ionicons name="rocket" size={18} color="#000" />
            <Text style={styles.upsellCtaText}>Become a Service Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upsellSecondary} onPress={() => navigation.navigate('Subscriptions')}>
            <Text style={styles.upsellSecondaryText}>Compare plans on Subscriptions</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const totalWeeklyRevenue = data.weeklyRevenue.reduce((a, b) => a + b, 0);
  const maxRevenue = Math.max(...data.weeklyRevenue, 1);
  const totalImpressions = data.engagement.reduce((a, e) => a + e.impressions, 0);
  const totalViews = data.engagement.reduce((a, e) => a + e.profileViews, 0);
  const totalClicks = data.engagement.reduce((a, e) => a + e.clicks, 0);
  const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;

  const kpis = [
    { key: 'revenue', label: 'Revenue (8w)', value: totalWeeklyRevenue, format: 'currency' as const, change: 18, icon: 'cash-outline' as const },
    { key: 'bookings', label: 'Bookings', value: data.weeklyBookings.reduce((a, b) => a + b, 0), format: 'number' as const, change: 12, icon: 'calendar-outline' as const },
    { key: 'rating', label: 'Rating', value: provider.rating, format: 'rating' as const, change: 0, icon: 'star-outline' as const },
    { key: 'views', label: 'Profile views', value: totalViews, format: 'number' as const, change: 24, icon: 'eye-outline' as const },
    { key: 'wallet', label: 'Wallet', value: provider.walletBalance, format: 'currency' as const, change: -4, icon: 'wallet-outline' as const },
    { key: 'completion', label: 'Profile score', value: completionPct, format: 'percent' as const, change: 0, icon: 'shield-checkmark-outline' as const },
  ] as const;

  const kanbanColumns: { status: JobItem['status']; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { status: 'new', label: 'New', color: COLORS.info, icon: 'time-outline' },
    { status: 'in_progress', label: 'In progress', color: COLORS.warning, icon: 'construct-outline' },
    { status: 'completed', label: 'Completed', color: COLORS.success, icon: 'checkmark-done-outline' },
  ];

  const quickActions = [
    { label: 'Portfolio', icon: 'images-outline' as const, tint: '#FF6B00' },
    { label: 'Calendar', icon: 'calendar-outline' as const, tint: '#5AC8FA' },
    { label: 'Messaging', icon: 'chatbubble-ellipses-outline' as const, tint: '#00D4AA' },
    { label: 'Marketing', icon: 'megaphone-outline' as const, tint: '#FFB84D' },
    { label: 'Verification', icon: 'shield-checkmark-outline' as const, tint: '#A78BFA' },
    { label: 'Subscription', icon: 'diamond-outline' as const, tint: '#FF6B00' },
    { label: 'Reviews', icon: 'star-outline' as const, tint: '#FFB84D' },
    { label: 'Notifications', icon: 'notifications-outline' as const, tint: '#FF4D6A' },
  ];

  const renderOverview = () => (
    <>
      {/* Greeting + actions */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingTitle}>Welcome back,</Text>
          <Text style={styles.greetingName}>{provider.businessName}</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate(`ServiceProviderProfile?providerId=${provider.id}`)}>
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.headerBtnText}>View profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn} onPress={logoutProvider}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* KPI cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.md, paddingTop: 2 }}>
        {kpis.map((k) => (
          <LinearGradient key={k.key} colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={styles.kpiIcon}>
                <Ionicons name={k.icon} size={16} color={COLORS.primary} />
              </View>
              {k.change !== 0 && (
                <View style={[styles.kpiChange, k.change < 0 && { backgroundColor: 'rgba(255,77,106,0.12)' }]}>
                  <Ionicons name={k.change > 0 ? 'arrow-up' : 'arrow-down'} size={10} color={k.change > 0 ? COLORS.success : COLORS.error} />
                  <Text style={[styles.kpiChangeText, k.change > 0 ? { color: COLORS.success } : { color: COLORS.error }]}>{Math.abs(k.change)}%</Text>
                </View>
              )}
            </View>
            <CountUp value={k.value} format={k.format} />
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Revenue chart */}
      <GlassCard style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Revenue</Text>
            <Text style={styles.cardSub}>Last 8 weeks</Text>
          </View>
          <View style={styles.chartTotal}>
            <Text style={styles.chartTotalValue}>{formatPrice(totalWeeklyRevenue)}</Text>
            <Text style={styles.chartTotalLabel}>total</Text>
          </View>
        </View>
        <View style={styles.barChart}>
          {data.weeklyRevenue.map((v, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[styles.barFill, { height: `${Math.max(8, (v / maxRevenue) * 100)}%` }]}
                />
              </View>
              <Text style={styles.barLabel}>{data.weeklyLabels[i]}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Engagement */}
      <GlassCard style={styles.chartCard}>
        <Text style={styles.cardTitle}>Customer engagement</Text>
        <Text style={[styles.cardSub, { marginBottom: SPACING.md }]}>Profile views, impressions, calls, chats & WhatsApp taps</Text>
        <View style={styles.engagementGrid}>
          {[
            { label: 'Views', value: totalViews, icon: 'eye-outline' },
            { label: 'Impressions', value: totalImpressions, icon: 'pulse-outline' },
            { label: 'CTR', value: `${ctr}%`, icon: 'trending-up-outline' },
            { label: 'Calls', value: data.engagement.reduce((a, e) => a + e.calls, 0), icon: 'call-outline' },
            { label: 'Chats', value: data.engagement.reduce((a, e) => a + e.chats, 0), icon: 'chatbubble-outline' },
            { label: 'WhatsApp', value: data.engagement.reduce((a, e) => a + e.whatsapp, 0), icon: 'logo-whatsapp' },
          ].map((e) => (
            <View key={e.label} style={styles.engagementItem}>
              <Ionicons name={e.icon as keyof typeof Ionicons.glyphMap} size={15} color={COLORS.primary} />
              <Text style={styles.engagementValue}>{e.value}</Text>
              <Text style={styles.engagementLabel}>{e.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.miniBars}>
          {data.engagement.map((e, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { height: `${Math.max(10, (e.profileViews / Math.max(...data.engagement.map((x) => x.profileViews), 1)) * 100)}%` }]} />
              </View>
              <Text style={styles.miniBarLabel}>{e.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Recent quotes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent quotation requests</Text>
        <TouchableOpacity onPress={() => setTab('quotes')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {data.quotes.slice(0, 3).map((q) => (
        <GlassCard key={q.id} style={styles.rowCard}>
          <Image source={{ uri: q.avatar }} style={styles.rowAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{q.customerName}</Text>
            <Text style={styles.rowSub}>{q.service} · {q.location}</Text>
            <Text style={styles.rowPrice}>{formatPrice(q.budget)}</Text>
          </View>
          <View style={[styles.statusPill, q.status === 'new' && { backgroundColor: 'rgba(90,200,250,0.12)' }, q.status === 'quoted' && { backgroundColor: 'rgba(255,184,77,0.12)' }, q.status === 'accepted' && { backgroundColor: 'rgba(0,212,170,0.12)' }]}>
            <Text style={[styles.statusText, q.status === 'new' && { color: COLORS.info }, q.status === 'quoted' && { color: COLORS.warning }, q.status === 'accepted' && { color: COLORS.success }]}>
              {q.status}
            </Text>
          </View>
        </GlassCard>
      ))}

      {/* Kanban preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Job board</Text>
        <TouchableOpacity onPress={() => setTab('jobs')}>
          <Text style={styles.seeAll}>Open board</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.kanbanPreview}>
        {kanbanColumns.map((col) => (
          <View key={col.status} style={styles.kanbanColPreview}>
            <Text style={[styles.kanbanColTitle, { color: col.color }]}>{col.label}</Text>
            <Text style={styles.kanbanColCount}>{jobs.filter((j) => j.status === col.status).length}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>Quick actions</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.quickAction} activeOpacity={0.7}>
            <View style={[styles.quickIcon, { backgroundColor: `${a.tint}1F` }]}>
              <Ionicons name={a.icon} size={20} color={a.tint} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reviews snapshot */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent reviews</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Reply</Text>
        </TouchableOpacity>
      </View>
      {data.reviews.slice(0, 2).map((r) => (
        <GlassCard key={r.id} style={styles.rowCard}>
          <Image source={{ uri: r.avatar }} style={styles.rowAvatar} />
          <View style={{ flex: 1 }}>
            <View style={styles.reviewNameRow}>
              <Text style={styles.rowTitle}>{r.customerName}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={10} color={COLORS.primary} />
                ))}
              </View>
            </View>
            <Text style={styles.rowSub} numberOfLines={2}>{r.text}</Text>
            <Text style={styles.rowMeta}>{r.date} · {r.service}</Text>
          </View>
        </GlassCard>
      ))}
    </>
  );

  const renderJobs = () => (
    <>
      <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Job board</Text>
      <View style={styles.kanban}>
        {kanbanColumns.map((col) => (
          <View key={col.status} style={styles.kanbanCol}>
            <View style={styles.kanbanColHeader}>
              <Ionicons name={col.icon} size={14} color={col.color} />
              <Text style={[styles.kanbanColTitle, { color: col.color }]}>{col.label}</Text>
              <View style={styles.kanbanCountPill}>
                <Text style={styles.kanbanCountText}>{jobs.filter((j) => j.status === col.status).length}</Text>
              </View>
            </View>
            {jobs.filter((j) => j.status === col.status).map((j) => (
              <GlassCard key={j.id} style={styles.jobCard}>
                <View style={styles.jobCardHeader}>
                  <Text style={styles.jobAmount}>{formatPrice(j.amount)}</Text>
                  <Text style={styles.jobDate}>{j.date}</Text>
                </View>
                <Text style={styles.jobService}>{j.service}</Text>
                <View style={styles.jobCustomerRow}>
                  <Image source={{ uri: j.avatar }} style={styles.jobAvatar} />
                  <Text style={styles.jobCustomer}>{j.customerName}</Text>
                  <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
                  <Text style={styles.jobLocation}>{j.location}</Text>
                </View>
                <View style={styles.jobActions}>
                  {col.status !== 'completed' && (
                    <TouchableOpacity style={styles.jobActionPrimary} onPress={() => moveJob(j.id, 'up')}>
                      <Text style={styles.jobActionPrimaryText}>{col.status === 'new' ? 'Start job' : 'Mark done'}</Text>
                    </TouchableOpacity>
                  )}
                  {col.status !== 'new' && (
                    <TouchableOpacity style={styles.jobActionSecondary} onPress={() => moveJob(j.id, 'down')}>
                      <Text style={styles.jobActionSecondaryText}>Move back</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            ))}
            {jobs.filter((j) => j.status === col.status).length === 0 && (
              <View style={styles.emptyCol}>
                <Ionicons name="sparkles-outline" size={18} color={COLORS.textTertiary} />
                <Text style={styles.emptyColText}>No {col.label.toLowerCase()} jobs</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const renderQuotes = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quotations</Text>
        <View style={styles.quotesSummary}>
          <Text style={styles.quotesSummaryText}>{quotes.filter((q) => q.status === 'new').length} new</Text>
        </View>
      </View>
      {quotes.map((q) => (
        <GlassCard key={q.id} style={styles.rowCard}>
          <Image source={{ uri: q.avatar }} style={styles.rowAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{q.customerName}</Text>
            <Text style={styles.rowSub}>{q.service} · {q.location}</Text>
            <View style={styles.quoteMetaRow}>
              <Text style={styles.rowPrice}>{formatPrice(q.budget)}</Text>
              <Text style={styles.rowMeta}>{q.date}</Text>
            </View>
            {q.notes ? <Text style={styles.quoteNotes}>"{q.notes}"</Text> : null}
            {q.status === 'new' && (
              <View style={styles.quoteActions}>
                <TouchableOpacity style={styles.quoteAccept} onPress={() => setQuoteStatus(q.id, 'accepted')}>
                  <Ionicons name="checkmark" size={14} color="#000" />
                  <Text style={styles.quoteAcceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quoteDecline} onPress={() => setQuoteStatus(q.id, 'declined')}>
                  <Text style={styles.quoteDeclineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quoteReply}>
                  <Ionicons name="send-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.quoteReplyText}>Send quote</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={[styles.statusPill, q.status === 'new' && { backgroundColor: 'rgba(90,200,250,0.12)' }, q.status === 'quoted' && { backgroundColor: 'rgba(255,184,77,0.12)' }, q.status === 'accepted' && { backgroundColor: 'rgba(0,212,170,0.12)' }, q.status === 'declined' && { backgroundColor: 'rgba(255,77,106,0.12)' }]}>
            <Text style={[styles.statusText, q.status === 'new' && { color: COLORS.info }, q.status === 'quoted' && { color: COLORS.warning }, q.status === 'accepted' && { color: COLORS.success }, q.status === 'declined' && { color: COLORS.error }]}>
              {q.status}
            </Text>
          </View>
        </GlassCard>
      ))}
    </>
  );

  const renderCustomers = () => (
    <>
      <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Customer CRM</Text>
      <GlassCard style={styles.crmSummary}>
        <View style={styles.crmStat}>
          <Text style={styles.crmValue}>{data.customers.length}</Text>
          <Text style={styles.crmLabel}>Active customers</Text>
        </View>
        <View style={styles.crmDivider} />
        <View style={styles.crmStat}>
          <Text style={styles.crmValue}>{formatPrice(data.customers.reduce((a, c) => a + c.totalSpent, 0))}</Text>
          <Text style={styles.crmLabel}>Lifetime value</Text>
        </View>
        <View style={styles.crmDivider} />
        <View style={styles.crmStat}>
          <Text style={styles.crmValue}>{data.customers.reduce((a, c) => a + c.bookings, 0)}</Text>
          <Text style={styles.crmLabel}>Total bookings</Text>
        </View>
      </GlassCard>
      {data.customers.map((c: CustomerRecord) => (
        <GlassCard key={c.id} style={styles.rowCard}>
          <Image source={{ uri: c.avatar }} style={styles.rowAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{c.name}</Text>
            <Text style={styles.rowSub}>{c.phone}</Text>
            <View style={styles.customerMetaRow}>
              <Text style={styles.customerMetaText}>Last: {c.lastService}</Text>
              <Text style={styles.customerMetaText}>· {c.lastVisit}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.rowPrice}>{formatPrice(c.totalSpent)}</Text>
            <Text style={styles.customerBookings}>{c.bookings} bookings</Text>
          </View>
        </GlassCard>
      ))}
    </>
  );

  const renderWallet = () => {
    const balance = provider.walletBalance;
    const pending = data.jobs.filter((j) => j.status === 'in_progress').reduce((a, j) => a + j.amount, 0);
    return (
      <>
        <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Wallet & payouts</Text>
        <LinearGradient colors={['rgba(255,107,0,0.25)', 'rgba(255,107,0,0.05)']} style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletLabel}>Available balance</Text>
              <Text style={styles.walletBalance}>{formatPrice(balance)}</Text>
              <Text style={styles.walletPending}>{formatPrice(pending)} pending · {provider.plan} plan</Text>
            </View>
            <View style={styles.walletMpesa}>
              <Ionicons name="phone-portrait-outline" size={18} color="#000" />
              <Text style={styles.walletMpesaText}>M-Pesa · {provider.mpesaNumber}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawBtnText}>Withdraw to M-Pesa</Text>
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.payoutMetaRow}>
          <View style={styles.payoutMeta}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.payoutMetaText}>Payouts every Friday</Text>
          </View>
          <View style={styles.payoutMeta}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.success} />
            <Text style={styles.payoutMetaText}>First payout after 1st job</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md, marginBottom: SPACING.md }]}>Transactions</Text>
        {data.transactions.map((t: WalletTransaction) => (
          <GlassCard key={t.id} style={styles.rowCard}>
            <View style={[styles.txIcon, t.amount < 0 && { backgroundColor: 'rgba(255,77,106,0.1)' }]}>
              <Ionicons name={t.type === 'payout' ? 'arrow-up-circle-outline' : t.type === 'fee' ? 'receipt-outline' : 'arrow-down-circle-outline'} size={18} color={t.amount < 0 ? COLORS.error : COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.description}</Text>
              <Text style={styles.rowMeta}>{t.date}</Text>
            </View>
            <Text style={[styles.txAmount, t.amount < 0 && { color: COLORS.error }]}>
              {t.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(t.amount))}
            </Text>
          </GlassCard>
        ))}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md, marginBottom: SPACING.md }]}>Subscription</Text>
        <GlassCard style={styles.rowCard}>
          <View style={styles.txIcon}>
            <Ionicons name={provider.plan === 'Premium' ? 'diamond' : 'sparkles'} size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{provider.plan} plan</Text>
            <Text style={styles.rowSub}>
              {provider.subscriptionExpiry ? `Renews ${new Date(provider.subscriptionExpiry).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Active'}
            </Text>
          </View>
          <TouchableOpacity style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </GlassCard>
      </>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case 'overview': return renderOverview();
      case 'jobs': return renderJobs();
      case 'quotes': return renderQuotes();
      case 'customers': return renderCustomers();
      case 'wallet': return renderWallet();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <Image source={{ uri: provider.logo || 'https://i.pravatar.cc/80?u=hama' }} style={styles.brandLogo} />
          <View>
            <View style={styles.brandNameRow}>
              <Text style={styles.brandName}>Seller Dashboard</Text>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
            </View>
            <Text style={styles.brandSub}>{provider.businessName} · {provider.plan}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.navigate('Inbox')}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.text} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Ionicons name={t.icon} size={15} color={tab === t.key ? '#000' : COLORS.textTertiary} />
            <Text style={[styles.tabText, tab === t.key && { color: '#000', fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={[styles.skeletonBlock, { width: 48, height: 48 }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skeletonBlock, { width: '60%', height: 14 }]} />
                <View style={[styles.skeletonBlock, { width: '85%', height: 12 }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
          style={{ opacity: fadeAnim }}
        >
          {renderTab()}
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bg: { ...StyleSheet.absoluteFillObject },
  roundBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  brandLogo: { width: 40, height: 40, borderRadius: RADIUS.md },
  brandNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandName: { ...FONTS.h3, fontSize: 16, lineHeight: 20 },
  brandSub: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  tabsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  greetingTitle: { ...FONTS.caption, color: COLORS.textTertiary },
  greetingName: { ...FONTS.h2, fontSize: 18, lineHeight: 24 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)' },
  headerBtnText: { ...FONTS.caption, fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  headerIconBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  kpiCard: { width: 158, padding: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiIcon: { width: 30, height: 30, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,107,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  kpiChange: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,212,170,0.12)' },
  kpiChangeText: { ...FONTS.caption, fontSize: 10, fontWeight: '700' },
  kpiValue: { ...FONTS.h3, fontSize: 21, lineHeight: 26, fontVariant: ['tabular-nums'] },
  kpiLabel: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary },
  chartCard: { marginHorizontal: SPACING.md, marginTop: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.md },
  cardTitle: { ...FONTS.bodyLarge, fontSize: 15, lineHeight: 20 },
  cardSub: { ...FONTS.caption, color: COLORS.textTertiary },
  chartTotal: { alignItems: 'flex-end' },
  chartTotalValue: { ...FONTS.price, fontSize: 17, lineHeight: 22, color: COLORS.primary },
  chartTotalLabel: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
  barColumn: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 16, height: 90, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  barLabel: { ...FONTS.caption, fontSize: 9, color: COLORS.textTertiary },
  engagementGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  engagementItem: { width: '33.3%', alignItems: 'center', gap: 3, paddingVertical: 10 },
  engagementValue: { ...FONTS.bodyLarge, fontSize: 15, fontVariant: ['tabular-nums'] },
  engagementLabel: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary },
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', height: 64, marginTop: SPACING.sm, gap: 6 },
  miniBarTrack: { flex: 1, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, justifyContent: 'flex-end', overflow: 'hidden' },
  miniBarFill: { width: '100%', borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,107,0,0.55)' },
  miniBarLabel: { ...FONTS.caption, fontSize: 8, color: COLORS.textTertiary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.lg, marginBottom: SPACING.md, paddingHorizontal: SPACING.md },
  sectionTitle: { ...FONTS.h3, fontSize: 17, lineHeight: 22, paddingHorizontal: SPACING.md },
  seeAll: { ...FONTS.caption, color: COLORS.primary, fontWeight: '700' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
  rowAvatar: { width: 42, height: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated },
  rowTitle: { ...FONTS.bodySmall, fontWeight: '600' },
  rowSub: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  rowPrice: { ...FONTS.bodySmall, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  rowMeta: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  statusText: { ...FONTS.caption, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  kanbanPreview: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md },
  kanbanColPreview: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  kanbanColTitle: { ...FONTS.caption, fontSize: 11, fontWeight: '700' },
  kanbanColCount: { ...FONTS.h3, fontSize: 22, fontVariant: ['tabular-nums'] },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, paddingHorizontal: SPACING.md },
  quickAction: { width: (390 - SPACING.md * 3 - 32) / 4, alignItems: 'center', gap: 6 },
  quickIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { ...FONTS.caption, fontSize: 10, color: COLORS.textSecondary },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  kanban: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md },
  kanbanCol: { flex: 1, gap: SPACING.sm },
  kanbanColHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kanbanCountPill: { marginLeft: 'auto', paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated },
  kanbanCountText: { ...FONTS.caption, fontSize: 10, fontWeight: '700' },
  jobCard: { padding: SPACING.sm + 2, gap: 4 },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobAmount: { ...FONTS.bodySmall, fontWeight: '700', color: COLORS.primary, fontSize: 13 },
  jobDate: { ...FONTS.caption, fontSize: 9, color: COLORS.textTertiary },
  jobService: { ...FONTS.bodySmall, fontSize: 12, fontWeight: '600' },
  jobCustomerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  jobAvatar: { width: 18, height: 18, borderRadius: RADIUS.full },
  jobCustomer: { ...FONTS.caption, fontSize: 10, color: COLORS.textSecondary, flex: 1 },
  jobLocation: { ...FONTS.caption, fontSize: 9, color: COLORS.textTertiary },
  jobActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  jobActionPrimary: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary, alignItems: 'center' },
  jobActionPrimaryText: { ...FONTS.caption, fontSize: 10, color: '#000', fontWeight: '700' },
  jobActionSecondary: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, alignItems: 'center' },
  jobActionSecondaryText: { ...FONTS.caption, fontSize: 10, color: COLORS.textSecondary },
  emptyCol: { alignItems: 'center', gap: 6, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border },
  emptyColText: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary, textAlign: 'center' },
  quotesSummary: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(90,200,250,0.12)' },
  quotesSummaryText: { ...FONTS.caption, fontSize: 11, color: COLORS.info, fontWeight: '700' },
  quoteMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteNotes: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary, fontStyle: 'italic', marginTop: 4 },
  quoteActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  quoteAccept: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  quoteAcceptText: { ...FONTS.caption, fontSize: 11, color: '#000', fontWeight: '700' },
  quoteDecline: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,77,106,0.12)', alignItems: 'center' },
  quoteDeclineText: { ...FONTS.caption, fontSize: 11, color: COLORS.error, fontWeight: '700' },
  quoteReply: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.bgElevated },
  quoteReplyText: { ...FONTS.caption, fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  crmSummary: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md },
  crmStat: { flex: 1, alignItems: 'center', gap: 4 },
  crmValue: { ...FONTS.h3, fontSize: 18, fontVariant: ['tabular-nums'] },
  crmLabel: { ...FONTS.caption, fontSize: 9, color: COLORS.textTertiary, textAlign: 'center' },
  crmDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  customerMetaRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  customerMetaText: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary },
  customerBookings: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary },
  walletCard: { marginHorizontal: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.xl, gap: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)' },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabel: { ...FONTS.caption, color: COLORS.textTertiary },
  walletBalance: { ...FONTS.title, fontSize: 34, lineHeight: 42, color: COLORS.primary, fontVariant: ['tabular-nums'] },
  walletPending: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary, marginTop: 4 },
  walletMpesa: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.success },
  walletMpesaText: { ...FONTS.caption, fontSize: 10, color: '#000', fontWeight: '700' },
  withdrawBtn: { paddingVertical: 15, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: 'center', ...SHADOWS.md },
  withdrawBtnText: { ...FONTS.button, fontSize: 15, color: '#000' },
  payoutMetaRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md, paddingHorizontal: SPACING.md },
  payoutMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  payoutMetaText: { ...FONTS.caption, fontSize: 10, color: COLORS.textSecondary, flex: 1 },
  txIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: 'rgba(0,212,170,0.1)', alignItems: 'center', justifyContent: 'center' },
  txAmount: { ...FONTS.bodySmall, fontWeight: '700', color: COLORS.success, fontVariant: ['tabular-nums'] },
  manageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)' },
  manageBtnText: { ...FONTS.caption, fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  skeletonWrap: { padding: SPACING.md, gap: SPACING.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard },
  skeletonBlock: { borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated },
  // Upsell
  upsellHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  upsellTitle: { ...FONTS.h3, fontSize: 17 },
  upsellContent: { padding: SPACING.md, paddingBottom: 48 },
  upsellHero: { alignItems: 'center', paddingVertical: SPACING.xl, gap: 8 },
  upsellIconWrap: { width: 88, height: 88, borderRadius: RADIUS.xxl, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  upsellHeading: { ...FONTS.h1, fontSize: 24, lineHeight: 32, textAlign: 'center' },
  upsellBody: { ...FONTS.bodySmall, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 21 },
  upsellPoints: { gap: 8, marginTop: SPACING.md, alignSelf: 'stretch', paddingHorizontal: SPACING.md },
  upsellPoint: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  upsellPointText: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, backgroundColor: COLORS.bgCard },
  planCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planName: { ...FONTS.bodyLarge, fontSize: 15 },
  planPrice: { ...FONTS.price, fontSize: 18, marginTop: 4 },
  planPeriod: { ...FONTS.caption, color: COLORS.textTertiary },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  planFeature: { ...FONTS.caption, fontSize: 11, color: COLORS.textSecondary },
  upsellCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  upsellCtaText: { ...FONTS.button, fontSize: 15, color: '#000' },
  upsellSecondary: { alignItems: 'center', paddingVertical: SPACING.md },
  upsellSecondaryText: { ...FONTS.bodySmall, color: COLORS.textTertiary },
});
