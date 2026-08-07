import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlass } from '../components/LiquidGlass';
import { LandlordSubscriptionModal } from '../components/LandlordSubscriptionModal';
import { getPlansForRole } from '../constants/plans';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { formatPrice } from '../utils/currency';

export const LandlordPlansScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const landlordPlans = getPlansForRole('landlord');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans & Pricing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <LinearGradient colors={[ACCENT, '#FF9500']} style={styles.heroGradient}>
                <Ionicons name="diamond" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Unlock Your Landlord Potential</Text>
            <Text style={styles.heroDesc}>
              Choose the plan that fits your property portfolio. List more, earn more, and get premium tools to manage your properties.
            </Text>
          </View>

          {/* Plans */}
          {landlordPlans.filter(p => p.tier !== 'Free').map((plan) => {
            const highlighted = plan.highlighted;
            return (
              <LiquidGlass key={plan.id} variant="elevated" style={[styles.planCard, highlighted && styles.planCardHighlighted]}>
                {highlighted && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="diamond" size={12} color="#fff" />
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}

                <Text style={[styles.planTier, highlighted && { color: ACCENT }]}>{plan.tier}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, highlighted && { color: ACCENT }]}>
                    {formatPrice(plan.price, plan.currency)}
                  </Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.featuresList}>
                  {plan.features.map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={highlighted ? ACCENT : COLORS.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.selectBtn, highlighted && styles.selectBtnHighlighted]}
                  onPress={() => setShowSubscribeModal(true)}
                  activeOpacity={0.85}
                >
                  {highlighted ? (
                    <LinearGradient colors={[ACCENT, '#FF9500']} style={styles.selectBtnGradient}>
                      <Text style={styles.selectBtnText}>Get Started</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.selectBtnText}>{plan.tier === 'Basic' ? 'Start Basic' : 'Go Pro'}</Text>
                  )}
                </TouchableOpacity>
              </LiquidGlass>
            );
          })}

          {/* Comparison */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Need help deciding?</Text>
            <Text style={styles.comparisonDesc}>
              Contact our support team for a personalized recommendation based on your property portfolio.
            </Text>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="chatbubble-outline" size={16} color={ACCENT} />
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Subscribe Modal */}
      <LandlordSubscriptionModal
        visible={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />
    </View>
  );
};

const ACCENT = COLORS.primary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  headerTitle: { ...FONTS.h3, color: COLORS.text },
  scrollContent: { padding: SPACING.lg },

  hero: { alignItems: 'center', marginBottom: SPACING.xl },
  heroIcon: { marginBottom: SPACING.md },
  heroGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  heroDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  planCard: {
    backgroundColor: '#121212',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  planCardHighlighted: {
    borderColor: `${ACCENT}60`,
    backgroundColor: '#121212',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: `${ACCENT}20`,
    marginBottom: SPACING.md,
  },
  popularBadgeText: { color: ACCENT, fontSize: 11, fontWeight: '700' },
  planTier: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: SPACING.md },
  planPrice: { color: COLORS.text, fontSize: 32, fontWeight: '900' },
  planPeriod: { color: COLORS.textTertiary, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#1A1A1A', marginBottom: SPACING.md },

  featuresList: { gap: 10, marginBottom: SPACING.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },

  selectBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  selectBtnHighlighted: { borderColor: ACCENT },
  selectBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  selectBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '700', textAlign: 'center', paddingVertical: 14 },

  comparisonSection: {
    backgroundColor: '#121212',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
  },
  comparisonTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  comparisonDesc: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: SPACING.md },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  contactBtnText: { color: ACCENT, fontSize: 13, fontWeight: '600' },
});
