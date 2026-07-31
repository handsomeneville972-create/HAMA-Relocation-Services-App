import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SubscriptionPlan } from '../constants/types';
import { formatPrice } from '../utils/currency';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface PricingCardProps {
  plan: SubscriptionPlan;
  onSelect?: () => void;
  /** Show compact mode for subscriptions screen (default: true) */
  compact?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, onSelect, compact = true }) => {
  const isHighlighted = plan.highlighted;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onSelect} style={styles.wrapper}>
      <View style={[styles.card, isHighlighted && styles.highlightedCard]}>
        {isHighlighted && (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>Most Popular</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={isHighlighted ? ['rgba(255, 107, 0, 0.1)', 'rgba(255, 255, 255, 0.05)'] : COLORS.gradientCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={[styles.tierName, isHighlighted && styles.highlightedText]}>{plan.tier}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, isHighlighted && styles.highlightedText]}>
              {formatPrice(plan.price, plan.currency)}
            </Text>
            {plan.price > 0 && <Text style={styles.perMonth}>/month</Text>}
          </View>
          {plan.price === 0 && <Text style={styles.freeText}>Free forever</Text>}

          <View style={styles.divider} />

          <View style={styles.features}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={isHighlighted ? COLORS.primary : COLORS.accent}
                />
                <Text style={[styles.featureText, isHighlighted && styles.highlightedFeatureText]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isHighlighted && styles.highlightedCta]}
            onPress={onSelect}
          >
            <LinearGradient
              colors={isHighlighted ? [COLORS.primary, COLORS.secondary] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, isHighlighted && styles.highlightedCtaText]}>
                {plan.price === 0 ? 'Get Started' : 'Explore Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 280,
    marginRight: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.md,
  },
  highlightedCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    ...SHADOWS.glow,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  gradient: {
    padding: SPACING.lg,
  },
  tierName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  highlightedText: {
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '800',
  },
  perMonth: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  freeText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING.md,
  },
  features: {
    gap: 12,
    marginBottom: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  highlightedFeatureText: {
    color: COLORS.text,
  },
  freemiumBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  highlightedCta: {
    ...SHADOWS.md,
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  highlightedCtaText: {
    color: '#fff',
  },
});
