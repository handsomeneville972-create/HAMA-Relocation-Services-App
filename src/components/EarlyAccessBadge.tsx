/**
 * HAMA™ Early Access Badge
 *
 * Displayed beside user profile, dashboard header, pricing page,
 * premium features, and upgrade buttons.
 *
 * Shows "EARLY ACCESS" to reinforce
 * exclusive early access status across the platform.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';

interface EarlyAccessBadgeProps {
  /** Badge variant — 'standard' for most places, 'compact' for tight spaces */
  variant?: 'standard' | 'compact' | 'pill';
  /** Badge text override — defaults to config EARLY_ACCESS_BADGE.TEXT */
  text?: string;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional location label for analytics tracking */
  location?: string;
}

export const EarlyAccessBadge: React.FC<EarlyAccessBadgeProps> = ({
  variant = 'standard',
  text,
  style,
  location,
}) => {
  const { isEarlyAccessActive } = useEarlyAccess();

  // Track badge impression for analytics
  useEffect(() => {
    if (isEarlyAccessActive && EARLY_ACCESS_CONFIG.EARLY_ACCESS_BADGE.ENABLED && location) {
      // Track badge view - use dynamic import to avoid circular deps
      const { trackFreemiumBadgeViewed } = require('../utils/analytics');
      trackFreemiumBadgeViewed(location);
    }
  }, [isEarlyAccessActive, location]);

  if (!isEarlyAccessActive || !EARLY_ACCESS_CONFIG.EARLY_ACCESS_BADGE.ENABLED) {
    return null;
  }

  const badgeText = text || EARLY_ACCESS_CONFIG.EARLY_ACCESS_BADGE.TEXT;

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name="sparkles" size={10} color={COLORS.warning} />
        <Text style={styles.compactText}>{badgeText}</Text>
      </View>
    );
  }

  if (variant === 'pill') {
    return (
      <View style={[styles.pillContainer, style]}>
        <LinearGradient
          colors={['rgba(255, 184, 77, 0.2)', 'rgba(255, 255, 255, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillGradient}
        >
          <Ionicons name="sparkles" size={12} color={COLORS.warning} />
          <Text style={styles.pillText}>{badgeText}</Text>
        </LinearGradient>
      </View>
    );
  }

  // Standard variant
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[COLORS.warning, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Ionicons name="sparkles" size={12} color="#fff" />
        <Text style={styles.text}>{badgeText}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.3)',
  },
  compactText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pillContainer: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
