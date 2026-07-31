/**
 * HAMA™ Early Access Announcement Banner
 *
 * A smooth, infinite-scrolling announcement banner displayed at the top of every page.
 * - Premium SaaS styling
 * - Smooth infinite scroll animation
 * - Responsive on all screen sizes
 * - Dismissible (persisted across sessions)
 * - Sticky at page top
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { logEvent } from '../utils/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNER_MESSAGE = EARLY_ACCESS_CONFIG.BANNER.TEXT + ' •';

const DOUBLE_MESSAGE = `${BANNER_MESSAGE}  •  ${BANNER_MESSAGE}`;

export const EarlyAccessBanner: React.FC = () => {
  const { isBannerDismissed, dismissBanner, isEarlyAccessActive } = useEarlyAccess();
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isEarlyAccessActive || isBannerDismissed) return;

    // Track banner display
    logEvent('banner_displayed');

    const animate = () => {
      scrollAnim.setValue(0);
      Animated.timing(scrollAnim, {
        toValue: -SCREEN_WIDTH * 1.5,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        // Loop infinitely
        animate();
      });
    };

    animate();

    return () => {
      scrollAnim.stopAnimation();
    };
  }, [isEarlyAccessActive, isBannerDismissed, scrollAnim]);

  if (!isEarlyAccessActive || !EARLY_ACCESS_CONFIG.BANNER.ENABLED || isBannerDismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 107, 0, 0.15)', 'rgba(255, 255, 255, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="rocket" size={14} color={COLORS.primaryLight} />
          </View>
          <View style={styles.scrollContainer}>
            <Animated.View
              style={[
                styles.scrollContent,
                { transform: [{ translateX: scrollAnim }] },
              ]}
            >
              <Text style={styles.messageText}>{DOUBLE_MESSAGE}</Text>
            </Animated.View>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={dismissBanner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    zIndex: 100,
  },
  gradient: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'hidden',
    height: 20,
  },
  scrollContent: {
    flexDirection: 'row',
    width: 9999, // Wide enough for animation
  },
  messageText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    // whiteSpace not supported in React Native
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
