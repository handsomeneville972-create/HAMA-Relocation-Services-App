/**
 * HAMA™ Engagement Prompt
 *
 * Contextual engagement prompts triggered by user behavior:
 * - Inactive 7+ days: "We miss you. Explore what's new."
 * - Power user: "You're among our top Founding Members."
 * - New user: "Complete your profile to unlock personalized recommendations."
 *
 * Designed to boost retention and feature adoption during Early Access.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, ANIMATION } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { logEvent } from '../utils/analytics';
import { navigateToRoute } from '../utils/navigation';

type PromptType = 'new_user' | 'inactive_user' | 'power_user' | null;

interface PromptConfig {
  type: PromptType;
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionRoute?: string;
  color: string;
  bgColors: [string, string];
}

const getPromptConfig = (user: any, daysSinceJoin: number, daysSinceActive: number, score: number): PromptConfig | null => {
  // New user — joined within 7 days
  if (daysSinceJoin <= 7) {
    return {
      type: 'new_user',
      icon: 'rocket-outline',
      title: 'Welcome to HAMA™!',
      message: 'Complete your profile to unlock personalized recommendations and make the most of your Founding Member benefits.',
      actionLabel: 'Complete Profile',
      actionRoute: 'Settings',
      color: COLORS.primary,
      bgColors: ['rgba(255, 107, 0, 0.1)', 'rgba(255, 107, 0, 0.02)'],
    };
  }

  // Inactive user — not active in 7+ days
  if (daysSinceActive >= 7) {
    return {
      type: 'inactive_user',
      icon: 'heart-outline',
      title: 'We miss you!',
      message: 'Explore what\'s new on HAMA™ — new features, tools, and updates are waiting for you.',
      actionLabel: 'See What\'s New',
      actionRoute: 'WhatsNew',
      color: COLORS.secondary,
      bgColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
    };
  }

  // Power user — high premium usage score
  if (score >= 70) {
    return {
      type: 'power_user',
      icon: 'trophy-outline',
      title: 'You\'re on fire!',
      message: 'You\'re among our top Founding Members. Your feedback shapes the future of HAMA™.',
      actionLabel: 'Share Feedback',
      color: COLORS.warning,
      bgColors: ['rgba(255, 184, 77, 0.1)', 'rgba(255, 184, 77, 0.02)'],
    };
  }

  return null;
};

export const EngagementPrompt: React.FC = () => {
  const { currentUser } = useAuth();
  const { isEarlyAccessActive } = useEarlyAccess();
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  if (!isEarlyAccessActive) return null;

  // Calculate days since join and last active
  const joinDate = currentUser.joinDate ? new Date(currentUser.joinDate) : new Date();
  const lastActive = currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt) : new Date();
  const now = new Date();
  const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  const premiumScore = currentUser.premiumUsageScore ?? 0;

  const prompt = getPromptConfig(currentUser, daysSinceJoin, daysSinceActive, premiumScore);

  if (!prompt || dismissed) return null;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: ANIMATION.normal,
      useNativeDriver: true,
    }).start(() => {
      setDismissed(true);
      logEvent('engagement_prompt_dismissed', { prompt_type: prompt.type ?? 'unknown' });
    });
  };

  const handleAction = () => {
    logEvent('engagement_prompt_acted', { prompt_type: prompt.type ?? 'unknown', action: prompt.actionLabel });
    if (prompt.actionRoute) {
      navigateToRoute(prompt.actionRoute);
    }
    setDismissed(true);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <GlassCard>
        <LinearGradient
          colors={prompt.bgColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Dismiss */}
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Ionicons name="close" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: prompt.color + '20' }]}>
              <Ionicons name={prompt.icon as any} size={24} color={prompt.color} />
            </View>
            <View style={styles.textSection}>
              <Text style={styles.title}>{prompt.title}</Text>
              <Text style={styles.message}>{prompt.message}</Text>
            </View>
          </View>

          {/* Action */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
            <Text style={[styles.actionLabel, { color: prompt.color }]}>{prompt.actionLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={prompt.color} />
          </TouchableOpacity>
        </LinearGradient>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingRight: 28,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
