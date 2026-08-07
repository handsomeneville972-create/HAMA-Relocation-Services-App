/**
 * TrialNotification
 *
 * Card-style popup that appears after 5 minutes of app activity during
 * the seeker's 7-day free trial. Informs the user about the upcoming
 * subscription requirement. Shows once per trial period.
 *
 * Green "Got it!" button dismisses and returns user to their current page.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const TRIAL_NOTIFICATION_DELAY = 5 * 60 * 1000; // 5 minutes

export const TrialNotification: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { trialActive, isSubscribed, trialNotificationShown, markTrialNotificationShown } = useSubscriptions();
  const [visible, setVisible] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!trialActive || isSubscribed || trialNotificationShown) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, TRIAL_NOTIFICATION_DELAY);

    return () => clearTimeout(timer);
  }, [trialActive, isSubscribed, trialNotificationShown]);

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      markTrialNotificationShown();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Green accent bar */}
          <View style={styles.accentBar} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="gift-outline" size={28} color={COLORS.success} />
          </View>

          {/* Content */}
          <Text style={styles.message}>
            You are currently on a 7 days free trial. After 7 days Subscribe to our plan of only KSh 170 to continue enjoying Hama's great features!
          </Text>

          {/* Green "Got it!" button */}
          <TouchableOpacity style={styles.button} onPress={handleDismiss} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
