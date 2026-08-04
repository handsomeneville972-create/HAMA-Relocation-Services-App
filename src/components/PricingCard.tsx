import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SubscriptionPlan } from '../constants/types';
import { formatPrice } from '../utils/currency';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface PricingCardTrialState {
  active: boolean;
  daysLeft: number;
}

interface PricingCardProps {
  plan: SubscriptionPlan;
  onSelect?: () => void;
  /** Stagger delay: card index in the row (index * 60ms entrance delay) */
  index?: number;
  /** Overrides the CTA label (e.g. "Start 7-Day Free Trial") */
  ctaLabel?: string;
  /** Overrides the top-right badge (e.g. "TRIAL") */
  badgeLabel?: string;
  /** When set, renders trial state: countdown chip + trial-aware CTA */
  trial?: PricingCardTrialState;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  onSelect,
  index = 0,
  ctaLabel,
  badgeLabel,
  trial,
}) => {
  const isHighlighted = plan.highlighted;

  // Entrance: fade + rise, staggered by index
  const entrance = useRef(new Animated.Value(0)).current;
  // Price count-up (0 → price)
  const priceAnim = useRef(new Animated.Value(0)).current;
  // "Most Popular" badge pulse
  const pulse = useRef(new Animated.Value(0)).current;
  // Press feedback
  const pressed = useRef(new Animated.Value(0)).current;

  const [displayPrice, setDisplayPrice] = useState(0);

  useEffect(() => {
    const delay = index * 60;
    Animated.spring(entrance, {
      toValue: 1,
      friction: 8,
      tension: 60,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.timing(priceAnim, {
      toValue: 1,
      duration: 450,
      delay: delay + 150,
      useNativeDriver: false,
    }).start();

    if (isHighlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
        ])
      ).start();
    }

    const listener = priceAnim.addListener(({ value }) => {
      setDisplayPrice(Math.round(value * plan.price));
    });
    return () => priceAnim.removeListener(listener);
  }, [index, isHighlighted, plan.price, entrance, priceAnim, pulse]);

  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  const effectiveCta = trial?.active
    ? `Trial active · ${trial.daysLeft}d left`
    : ctaLabel || (plan.price === 0 ? 'Get Started' : 'Choose Plan');

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: entrance,
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            { scale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => pressed.setValue(1)}
        onPressOut={() => pressed.setValue(0)}
        onPress={onSelect}
      >
        {isHighlighted ? (
          <LinearGradient
            colors={['#FF6A00', '#FF8A3D', 'rgba(255,107,0,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.highlightedInner}>
              {renderBody()}
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.card}>{renderBody()}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  function renderBody() {
    const badgeText = badgeLabel || (isHighlighted ? 'Most Popular' : undefined);
    return (
      <View style={styles.body}>
        {badgeText && (
          <Animated.View style={[styles.badgeWrap, isHighlighted && { transform: [{ scale: pulseScale }] }]}>
            <LinearGradient
              colors={isHighlighted ? [COLORS.primary, COLORS.secondary] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Text style={[styles.badgeText, !isHighlighted && styles.badgeTextPlain]}>{badgeText}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <Text style={[styles.tierName, isHighlighted && styles.highlightedText]}>{plan.tier}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, isHighlighted && styles.highlightedText]}>
            {formatPrice(displayPrice, plan.currency)}
          </Text>
          {plan.price > 0 && <Text style={styles.perMonth}>/month</Text>}
        </View>
        {plan.price === 0 && (
          <Text style={styles.freeText}>
            {trial?.active ? `Trial ends in ${trial.daysLeft} day${trial.daysLeft === 1 ? '' : 's'}` : trial ? '7 days of Premium access' : 'Free forever'}
          </Text>
        )}

        {trial && (
          <View style={styles.trialChip}>
            <Ionicons name="time-outline" size={12} color={COLORS.primary} />
            <Text style={styles.trialChipText}>
              {trial.active ? 'Full Premium access unlocked' : 'Everything in Premium · no card required'}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.features}>
          {plan.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
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

        <View style={[styles.ctaButton, isHighlighted && styles.highlightedCta]}>
          <LinearGradient
            colors={isHighlighted ? [COLORS.primary, COLORS.secondary] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, isHighlighted && styles.highlightedCtaText]}>
              {effectiveCta}
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }
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
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.md,
  },
  gradientBorder: {
    borderRadius: RADIUS.xl,
    padding: 1.5,
    ...SHADOWS.glow,
  },
  highlightedInner: {
    borderRadius: RADIUS.xl - 1.5,
    overflow: 'hidden',
    backgroundColor: '#141414',
  },
  body: {
    padding: SPACING.lg,
  },
  badgeWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextPlain: {
    color: COLORS.textSecondary,
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
  trialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,107,0,0.12)',
  },
  trialChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
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
