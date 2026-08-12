/**
 * HAMA™ Founder Dashboard
 *
 * Dedicated growth dashboard for founders/admins showing:
 * - Total Users / Active Users / New Registrations
 * - Growth Rates (Daily, Weekly, Referral)
 * - Engagement Metrics (Session Duration, Feature Usage, Retention)
 * - Monetization Readiness (Upgrade Interest, Most Desired Plans, Revenue Forecast)
 * - Revenue Forecasting Engine
 * - Feature Request Rankings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { featureRequestService } from '../services/earlyAccessService';
import { formatPrice } from '../utils/currency';

// ===== Mock Analytics Data =====
// In production, these would come from a backend analytics service

const MOCK_ANALYTICS = {
  totalUsers: 1256,
  activeUsers: 892,
  newRegistrations: 47,
  dailyGrowthRate: 3.8,
  weeklyGrowthRate: 21.5,
  avgSessionDuration: '12m 34s',
  featureUsage: 68,
  retentionRate: 87,
  upgradeInterest: [
    { plan: 'Premium', interested: 126, price: 199, currency: 'KSh' as const },
    { plan: 'Pro', interested: 44, price: 599, currency: 'KSh' as const },
    { plan: 'Basic', interested: 307, price: 399, currency: 'KSh' as const },
  ],
  topRequests: [
    { title: 'Inventory Forecasting', votes: 87 },
    { title: 'Supplier Marketplace', votes: 54 },
    { title: 'Advanced Reporting', votes: 31 },
    { title: 'AI Contract Analysis', votes: 28 },
    { title: 'Multi-Currency Support', votes: 22 },
  ],
};

interface FounderDashboardScreenProps {
  navigation?: any;
}

export const FounderDashboardScreen: React.FC<FounderDashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [featureRequestCount, setFeatureRequestCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const frc = await featureRequestService.getCount();
      setFeatureRequestCount(frc);
    };
    loadData();
  }, []);

  const analytics = { ...MOCK_ANALYTICS };

  // Revenue forecast
  const totalForecast = analytics.upgradeInterest.reduce((sum, item) => {
    return sum + (item.interested * item.price);
  }, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Founder Dashboard</Text>
        </View>
        <Text style={styles.headerSubtitle}>Growth metrics, analytics, and revenue forecasting</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Users Section */}
        <Text style={styles.sectionTitle}>Users</Text>
        <View style={styles.metricsGrid}>
          <MetricCard icon="people" value={analytics.totalUsers.toLocaleString()} label="Total Users" color={COLORS.primary} />
          <MetricCard icon="person-check" value={analytics.activeUsers.toLocaleString()} label="Active Users" color={COLORS.accent} />
          <MetricCard icon="person-add" value={analytics.newRegistrations.toString()} label="New Registrations" color={COLORS.info} />
        </View>

        {/* Growth Section */}
        <Text style={styles.sectionTitle}>Growth</Text>
        <View style={styles.metricsGrid}>
          <MetricCard icon="trending-up" value={`${analytics.dailyGrowthRate}%`} label="Daily Growth" color={COLORS.accent} />
          <MetricCard icon="trending-up" value={`${analytics.weeklyGrowthRate}%`} label="Weekly Growth" color={COLORS.primary} />
        </View>

        {/* Engagement Section */}
        <Text style={styles.sectionTitle}>Engagement</Text>
        <View style={styles.metricsGrid}>
          <MetricCard icon="time" value={analytics.avgSessionDuration} label="Avg Session" color={COLORS.warning} />
          <MetricCard icon="sparkles" value={`${analytics.featureUsage}%`} label="Feature Usage" color={COLORS.primary} />
          <MetricCard icon="heart" value={`${analytics.retentionRate}%`} label="Retention" color={COLORS.accent} />
        </View>

        {/* Monetization Readiness */}
        <Text style={styles.sectionTitle}>Monetization Readiness</Text>

        {/* Upgrade Interest */}
        <GlassCard>
          <Text style={styles.cardTitle}>Upgrade Interest</Text>
          <Text style={styles.cardSubtitle}>Users interested in paid plans</Text>
          {analytics.upgradeInterest.map((item, i) => (
            <View key={i} style={styles.interestRow}>
              <View style={styles.interestInfo}>
                <Text style={styles.interestPlan}>{item.plan}</Text>
                <Text style={styles.interestCount}>{item.interested} interested users</Text>
              </View>
              <Text style={styles.revenueProjection}>
                {formatPrice(item.interested * item.price, item.currency)}/mo
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Revenue Forecast */}
        <GlassCard>
          <LinearGradient
            colors={['rgba(0, 212, 170, 0.08)', 'rgba(255, 107, 0, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.forecastCard}
          >
            <Ionicons name="cash-outline" size={32} color={COLORS.accent} />
            <Text style={styles.forecastTitle}>Revenue Forecast</Text>
            <Text style={styles.forecastValue}>{formatPrice(totalForecast, 'KSh')}/mo</Text>
            <Text style={styles.forecastSub}>
              Based on {analytics.upgradeInterest.reduce((s, i) => s + i.interested, 0)} interested users across all plans
            </Text>
          </LinearGradient>
        </GlassCard>

        {/* Feature Requests */}
        <View style={styles.metricsGrid}>
          <MetricCard icon="bulb" value={featureRequestCount.toLocaleString()} label="Feature Requests" color={COLORS.warning} />
        </View>

        {/* Top Feature Requests */}
        <GlassCard>
          <Text style={styles.cardTitle}>Most Requested Features</Text>
          {analytics.topRequests.map((req, i) => (
            <View key={i} style={styles.requestRow}>
              <Text style={styles.requestRank}>{i + 1}</Text>
              <View style={styles.requestInfo}>
                <Text style={styles.requestTitle}>{req.title}</Text>
                <View style={styles.requestVoteRow}>
                  <Ionicons name="arrow-up-circle" size={12} color={COLORS.primary} />
                  <Text style={styles.requestVotes}>{req.votes} requests</Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ===== Metric Card Sub-component =====

const MetricCard: React.FC<{ icon: string; value: string; label: string; color: string }> = ({ icon, value, label, color }) => (
  <GlassCard style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  metricValue: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  metricLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  interestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  interestInfo: {
    gap: 2,
  },
  interestPlan: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  interestCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  revenueProjection: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  forecastCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 8,
  },
  forecastTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  forecastValue: {
    ...FONTS.h1,
    color: COLORS.accent,
  },
  forecastSub: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  requestRank: {
    ...FONTS.h3,
    color: COLORS.primary,
    width: 28,
    textAlign: 'center',
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  requestVoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestVotes: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
});
