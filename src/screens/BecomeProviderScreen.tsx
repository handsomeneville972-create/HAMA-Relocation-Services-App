import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { CATEGORIES } from '../services/providerOnboardingService';
import { useProvider } from '../contexts/ProviderContext';

interface Props {
  navigation: any;
}

const BENEFITS = [
  {
    icon: 'flash-outline',
    title: 'Free to join. Visible immediately.',
    sub: 'Publish your profile right away — no approval wait, no signup fees.',
  },
  {
    icon: 'time-outline',
    title: 'About 5 minutes',
    sub: 'Complete one short profile and clients can start finding and calling you.',
  },
  {
    icon: 'options-outline',
    title: 'You stay in control',
    sub: 'Choose your service areas, availability, and pricing. Update anytime.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Complete profiles rank higher',
    sub: 'Certificates and clear work photos give the biggest ranking boost.',
  },
] as const;

export const BecomeProviderScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isProvider } = useProvider();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Provider</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LinearGradient colors={['rgba(255,107,0,0.3)', 'rgba(255,107,0,0.08)']} style={styles.heroIconWrap}>
            <Ionicons name="storefront" size={40} color={COLORS.primary} />
          </LinearGradient>
          <Text style={styles.eyebrow}>BECOME A SERVICE PROVIDER</Text>
          <Text style={styles.title}>Turn your skill into more paying jobs.</Text>
          <Text style={styles.subtitle}>
            Join HAMA in Nairobi, Kisumu, Mombasa and beyond as a mover, plumber, electrician, cleaner, painter or home-service professional.
          </Text>
        </View>

        <View style={styles.benefitList}>
          {BENEFITS.map((b) => (
            <GlassCard key={b.title} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitSub}>{b.sub}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={styles.trustNotice}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          <Text style={styles.trustText}>
            Profiles go live immediately after onboarding so clients can discover you right away.
          </Text>
        </View>

        <Text style={styles.categoriesLabel}>In-demand categories</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.slice(0, 6).map((c) => (
            <View key={c.value} style={styles.categoryChip}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.categoryChipText}>{c.value}</Text>
            </View>
          ))}
        </View>

        {isProvider ? (
          <TouchableOpacity style={styles.cta} onPress={() => navigation.replace('SellerDashboard')}>
            <Ionicons name="analytics" size={18} color="#000" />
            <Text style={styles.ctaText}>Open Seller Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('ServiceProviderOnboarding')}>
            <Ionicons name="rocket" size={18} color="#000" />
            <Text style={styles.ctaText}>Start Registration</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.finePrint}>Free to join • No approval queue • Update your profile anytime</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bg: { ...StyleSheet.absoluteFillObject },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.md },
  headerBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...FONTS.h3, fontSize: 16, lineHeight: 20 },
  content: { padding: SPACING.md, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', paddingVertical: SPACING.lg },
  heroIconWrap: { width: 88, height: 88, borderRadius: RADIUS.xxl, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  eyebrow: { ...FONTS.caption, color: COLORS.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: SPACING.sm },
  title: { ...FONTS.h1, textAlign: 'center' },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
  benefitList: { gap: SPACING.sm },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  benefitIcon: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { ...FONTS.bodyLarge, fontSize: 15 },
  benefitSub: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2, lineHeight: 17 },
  trustNotice: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,212,170,0.07)', borderWidth: 1, borderColor: 'rgba(0,212,170,0.2)' },
  trustText: { ...FONTS.caption, color: COLORS.success, flex: 1 },
  categoriesLabel: { ...FONTS.caption, color: COLORS.textSecondary, fontWeight: '600', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  categoryChipText: { ...FONTS.caption, color: COLORS.textSecondary },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, paddingVertical: 17, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  ctaText: { ...FONTS.button, color: '#000', fontSize: 16 },
  finePrint: { ...FONTS.caption, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.md },
});
