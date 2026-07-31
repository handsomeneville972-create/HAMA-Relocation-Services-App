/**
 * HAMA™ Early Access Premium Modal
 *
 * Displayed when users click any upgrade/subscribe/pricing CTA during the
 * Early Access Program. Communicates that users receive complimentary
 * premium access as early access members.
 *
 * The experience should feel intentional, premium, and exciting — never
 * temporary or unfinished. NEVER mention missing payment integrations,
 * technical limitations, or incomplete infrastructure.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { logEvent, trackUpgradeClick } from '../utils/analytics';
import { navigateToRoute } from '../utils/navigation';

export const EarlyAccessModal: React.FC = () => {
  const { isPremiumModalVisible, hidePremiumModal, isEarlyAccessActive, showPremiumModal } = useEarlyAccess();

  if (!isEarlyAccessActive || !EARLY_ACCESS_CONFIG.PREMIUM_MODAL.ENABLED) {
    return null;
  }

  const handleContinueExploring = () => {
    trackUpgradeClick('continue_exploring');
    logEvent('early_access_continue_exploring');
    hidePremiumModal();
  };

  const handleViewPremiumFeatures = () => {
    logEvent('early_access_view_premium_features');
    hidePremiumModal();
    navigateToRoute('Subscriptions');
  };

  return (
    <Modal
      visible={isPremiumModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hidePremiumModal}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleContinueExploring}
        />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(10, 10, 10, 0.99)', 'rgba(0, 0, 0, 0.99)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modal}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hidePremiumModal}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Large celebratory icon */}
              <LinearGradient
                colors={COLORS.gradientPremium}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="rocket" size={36} color="#fff" />
              </LinearGradient>

              {/* Title */}
              <Text style={styles.title}>Welcome to HAMA™ Early Access</Text>

              {/* Message */}
              <Text style={styles.message}>
                As one of our{' '}
                <Text style={styles.highlight}>Founding Members</Text>, you currently
                enjoy complimentary access to all premium features across the
                HAMA™ ecosystem.
              </Text>

              <Text style={styles.message}>
                Explore advanced AI capabilities, business management tools,
                automation workflows, analytics, reporting systems, customer
                engagement tools, and future releases at no cost.
              </Text>

              <Text style={styles.gratitudeMessage}>
                Your feedback helps shape the future of HAMA™.
              </Text>

              <Text style={styles.gratitudeMessage}>
                Thank you for joining us early.
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Feature highlights */}
              <View style={styles.featuresGrid}>
                {[
                  { icon: 'sparkles', label: 'AI-Powered Tools', color: COLORS.primary },
                  { icon: 'analytics', label: 'Analytics', color: COLORS.accent },
                  { icon: 'briefcase', label: 'Business Management', color: COLORS.secondary },
                  { icon: 'infinite', label: 'Premium Experiences', color: COLORS.warning },
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                      <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                    </View>
                    <Text style={styles.featureLabel}>{feature.label}</Text>
                  </View>
                ))}
              </View>

              {/* Primary Button - Continue Exploring */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinueExploring}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Continue Exploring</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Button - View Premium Features */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewPremiumFeatures}
              >
                <Text style={styles.secondaryButtonText}>View Premium Features</Text>
              </TouchableOpacity>


            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  modal: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...SHADOWS.glow,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  highlight: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  gratitudeMessage: {
    color: COLORS.accent,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  featureItem: {
    width: '45%',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

});
