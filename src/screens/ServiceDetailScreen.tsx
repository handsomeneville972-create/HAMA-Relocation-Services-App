import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { ReviewSection, type ReviewItem } from '../components/ReviewSection';
import { getServiceProviderById } from '../services/serviceProviderService';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ServiceProvider } from '../constants/types';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const ServiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { providerId } = route.params;
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [svcReviews, setSvcReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    getServiceProviderById(providerId).then(({ data }) => {
      if (data) setProvider(data);
      setLoading(false);
    });
  }, [providerId]);

  if (!provider) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonLoader type="detail-hero" />
          <View style={{ padding: SPACING.md, gap: SPACING.md }}>
            <SkeletonLoader type="detail-section" count={4} />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: provider.banner }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Provider Info */}
        <View style={styles.providerInfo}>
          <Image source={{ uri: provider.logo }} style={styles.providerLogo} />
          <View style={styles.providerText}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {provider.verified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            <Text style={styles.providerCategory}>{provider.subcategory} • {provider.category}</Text>
          </View>
        </View>

        {/* Rating & Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <Text style={styles.statValue}>{provider.rating}</Text>
            <Text style={styles.statLabel}>{provider.reviewCount} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={styles.statValue}>{provider.responseTime}</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.statValue}>{provider.availability}</Text>
            <Text style={styles.statLabel}>Availability</Text>
          </View>
        </View>

        {/* Description */}
        <GlassCard>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{provider.description}</Text>
        </GlassCard>

        {/* Pricing */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Text style={styles.pricingText}>{provider.pricing}</Text>
        </GlassCard>

        {/* Contact */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{provider.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{provider.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{provider.location}</Text>
          </View>
        </GlassCard>

        {/* Reviews Preview */}
        <GlassCard>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.seeAllText}>({provider.reviewCount})</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={24} color={colors.warning} />
            <Text style={styles.ratingValue}>{provider.rating}</Text>
            <Text style={styles.ratingMax}>/ 5.0</Text>
          </View>
          <ReviewSection
            reviews={svcReviews}
            emptyText="No reviews yet — be the first to review this service provider."
            onSubmitReview={(rating, content) => {
              setSvcReviews(prev => [
                { id: `local-${Date.now()}`, name: 'You', rating, date: 'Just now', content },
                ...prev,
              ]);
            }}
          />
        </GlassCard>

        <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <LinearGradient colors={[colors.bgBlur, colors.bg]} style={styles.ctaGradient}>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color={colors.text} />
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bookGradient}>
              <Text style={styles.bookText}>Request Quotation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroContainer: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: -30,
    gap: 16,
    zIndex: 1,
  },
  content: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  providerLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  providerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    ...FONTS.h2,
    color: colors.text,
  },
  providerCategory: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.glassBorder,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  pricingText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingValue: {
    ...FONTS.h1,
    color: colors.text,
  },
  ratingMax: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ctaGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 12,
    paddingBottom: 30,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  callButton: {
    width: 60,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 2,
  },
  callText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  bookGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
