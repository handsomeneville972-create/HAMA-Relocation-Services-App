/**
 * HAMA™ Email Capture / Newsletter Subscription Component
 *
 * A compact form that collects email and name for product updates,
 * feature announcements, and launch notifications.
 *
 * Features:
 * - Email + Name fields
 * - One-tap subscription
 * - Dismissible (persisted across sessions)
 * - Analytics tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { useAuth } from '../contexts/AuthContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { trackEmailCaptureViewed, trackEmailSubscribed, trackEmailDismissed } from '../utils/analytics';

interface EmailCaptureFormProps {
  /** Show in a compact inline style (default: true) */
  compact?: boolean;
  /** Custom message to display */
  message?: string;
}

export const EmailCaptureForm: React.FC<EmailCaptureFormProps> = ({
  compact = true,
  message = 'Get product updates, new features, and launch announcements.',
}) => {
  const { isEmailCaptureDismissed, dismissEmailCapture, subscribeToEmails } = useEarlyAccess();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [name, setName] = useState(currentUser?.name ?? '');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!EARLY_ACCESS_CONFIG.EMAIL_CAPTURE.ENABLED || isEmailCaptureDismissed) return null;

  // Track view once
  React.useEffect(() => {
    trackEmailCaptureViewed();
  }, []);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Valid Email', 'Please enter a valid email address.');
      return;
    }

    setSubscribing(true);
    try {
      await subscribeToEmails(email.trim(), name.trim() || undefined, currentUser?.id);
      setSubscribed(true);
      trackEmailSubscribed();
    } catch {
      Alert.alert('Error', 'Could not subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    trackEmailDismissed();
    dismissEmailCapture();
  };

  if (subscribed) {
    return (
      <GlassCard style={styles.subscribedCard}>
        <View style={styles.subscribedContent}>
          <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.subscribedIcon}>
            <Ionicons name="mail-open" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.subscribedInfo}>
            <Text style={styles.subscribedTitle}>Subscribed!</Text>
            <Text style={styles.subscribedDesc}>
              You'll receive updates at {email}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  }

  if (compact) {
    return (
      <GlassCard style={styles.compactCard}>
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <View style={styles.compactRow}>
          <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compactIcon}>
            <Ionicons name="mail-outline" size={16} color="#fff" />
          </LinearGradient>
          <View style={styles.compactTextContent}>
            <Text style={styles.compactTitle}>Stay Updated</Text>
            <Text style={styles.compactDesc}>{message}</Text>
          </View>
        </View>
        <View style={styles.compactForm}>
          <TextInput
            style={styles.emailInput}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.subscribeBtn, subscribing && styles.subscribeBtnDisabled]}
            onPress={handleSubscribe}
            disabled={subscribing}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeBtnGrad}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.subscribeBtnText}>Subscribe</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  }

  // Full version (not currently used but available)
  return (
    <GlassCard>
      <View style={styles.fullContent}>
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fullIcon}>
          <Ionicons name="mail-outline" size={24} color="#fff" />
        </LinearGradient>
        <Text style={styles.fullTitle}>Don't Miss Out</Text>
        <Text style={styles.fullDesc}>{message}</Text>

        <TextInput
          style={styles.fullInput}
          placeholder="Your name (optional)"
          placeholderTextColor={COLORS.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.fullInput}
          placeholder="your@email.com"
          placeholderTextColor={COLORS.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.fullSubscribeBtn, subscribing && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={subscribing}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fullSubscribeGrad}
          >
            {subscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.fullSubscribeText}>Subscribe to Updates</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  // Compact variant
  compactCard: {
    padding: SPACING.md,
    position: 'relative',
  },
  dismissBtn: {
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
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingRight: 30,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTextContent: {
    flex: 1,
  },
  compactTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  compactDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  compactForm: {
    flexDirection: 'row',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  subscribeBtn: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnGrad: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Subscribed state
  subscribedCard: {
    padding: SPACING.md,
  },
  subscribedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscribedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribedInfo: {
    flex: 1,
  },
  subscribedTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  subscribedDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  // Full variant
  fullContent: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 12,
  },
  fullIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  fullTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  fullDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  fullInput: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  fullSubscribeBtn: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  fullSubscribeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  fullSubscribeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
