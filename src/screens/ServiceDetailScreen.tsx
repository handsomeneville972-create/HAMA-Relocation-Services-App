import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { ReviewSection, type ReviewItem } from '../components/ReviewSection';
import { getServiceProviderById } from '../services/serviceProviderService';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { ServiceProvider } from '../constants/types';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const ServiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
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
          <LinearGradient colors={['transparent', COLORS.bg]} style={styles.heroGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Provider Info */}
        <View style={styles.providerInfo}>
          <Image source={{ uri: provider.logo }} style={styles.providerLogo} />
          <View style={styles.providerText}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {provider.verified && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </View>
            <Text style={styles.providerCategory}>{provider.subcategory} • {provider.category}</Text>
          </View>
        </View>

        {/* Rating & Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={18} color={COLORS.warning} />
            <Text style={styles.statValue}>{provider.rating}</Text>
            <Text style={styles.statLabel}>{provider.reviewCount} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={COLORS.accent} />
            <Text style={styles.statValue}>{provider.responseTime}</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
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
            <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>{provider.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>{provider.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
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
            <Ionicons name="star" size={24} color={COLORS.warning} />
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
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <LinearGradient colors={[COLORS.bgBlur, COLORS.bg]} style={styles.ctaGradient}>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color={COLORS.text} />
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bookGradient}>
              <Text style={styles.bookText}>Request Quotation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  providerLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: COLORS.bg,
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
    color: COLORS.text,
  },
  providerCategory: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.glassBorder,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  pricingText: {
    color: COLORS.accent,
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
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    color: COLORS.primaryLight,
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
    color: COLORS.text,
  },
  ratingMax: {
    color: COLORS.textTertiary,
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
  },
  callButton: {
    width: 60,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 2,
  },
  callText: {
    color: COLORS.text,
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
