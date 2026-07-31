/**
 * HAMA™ Dashboard Welcome Card
 *
 * A prominent welcome card displayed on the home/dashboard screen during the
 * Early Access Program. Communicates founding member benefits and premium
 * platform capabilities.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { EarlyAccessBadge } from './EarlyAccessBadge';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';

const { width } = Dimensions.get('window');

export const DashboardWelcomeCard: React.FC = () => {
  const { isWelcomeCardDismissed, dismissWelcomeCard, isEarlyAccessActive } = useEarlyAccess();

  if (!isEarlyAccessActive || !EARLY_ACCESS_CONFIG.DASHBOARD_WELCOME_CARD.ENABLED || isWelcomeCardDismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GlassCard elevated style={styles.card}>
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={dismissWelcomeCard}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={COLORS.gradientPremium}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="rocket" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>Welcome to HAMA™ Early Access</Text>
              <EarlyAccessBadge variant="compact" style={{ alignSelf: 'flex-start' }} />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            You are among our earliest users and currently receive complimentary
            access to premium platform capabilities.
          </Text>

          {/* Feature highlights */}
          <View style={styles.featuresList}>
            {[
              { icon: 'sparkles', label: 'AI-Powered Business Tools', color: COLORS.primary },
              { icon: 'briefcase', label: 'Business Management', color: COLORS.secondary },
              { icon: 'analytics', label: 'Advanced Analytics', color: COLORS.accent },
              { icon: 'cog', label: 'Workflow Automation', color: COLORS.warning },
              { icon: 'people', label: 'Customer Tools', color: COLORS.info },
              { icon: 'infinite', label: 'Upcoming Releases', color: COLORS.primaryLight },
            ].map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: item.color + '30' }]}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                </View>
                <Text style={styles.featureLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            Explore AI-powered business management, advanced analytics, workflow
            automation, customer tools, and upcoming releases.
            Thank you for helping shape the future of HAMA™.
          </Text>

          {/* Decorative accent line */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </LinearGradient>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    borderWidth: 0,
  },
  gradientOverlay: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
    paddingRight: 40, // space for dismiss button
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
    lineHeight: 24,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  featuresList: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
});
