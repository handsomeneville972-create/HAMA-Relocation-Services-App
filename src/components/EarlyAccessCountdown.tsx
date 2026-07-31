/**
 * HAMA™ Early Access Countdown Component
 *
 * A countdown-ready component that can later be activated without redesigning
 * the UI when subscription plans officially launch.
 *
 * Currently displays a placeholder message. When subscriptions are ready
 * to launch, simply set `ACTIVE: true` in the config and provide a target
 * launch date — the countdown will automatically activate.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EarlyAccessCountdownProps {
  /** Target launch date — when provided and in the future, shows countdown */
  targetDate?: Date;
  /** Whether to show the countdown as active (set to true when subscriptions launch) */
  active?: boolean;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export const EarlyAccessCountdown: React.FC<EarlyAccessCountdownProps> = ({
  targetDate,
  active = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || !targetDate) {
      setTimeLeft(null);
      return;
    }

    // Update countdown every second
    const tick = () => {
      setTimeLeft(calculateTimeLeft(targetDate));
    };
    tick();
    const interval = setInterval(tick, 1000);

    // Pulsing glow animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      pulse.stop();
    };
  }, [active, targetDate, pulseAnim]);

  // When not active, show the placeholder (ready for activation)
  if (!active || !targetDate) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.05)', 'rgba(255, 255, 255, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconRow}>
              <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.placeholderTitle}>Subscriptions Launching Soon</Text>
            <Text style={styles.placeholderDesc}>
              Premium subscriptions will be available once the Early Access Program concludes.
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const allZero = timeLeft && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.countdownWrapper, { opacity: pulseAnim }]}>
        <LinearGradient
          colors={['rgba(255, 184, 77, 0.12)', 'rgba(255, 255, 255, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.countdownHeader}>
              <Ionicons name="alarm-outline" size={20} color={COLORS.warning} />
              <Text style={styles.countdownTitle}>
                {allZero ? "We've Launched!" : 'Subscriptions Launching In'}
              </Text>
            </View>

            {!allZero && timeLeft && (
              <View style={styles.countdownGrid}>
                <View style={styles.countdownUnit}>
                  <LinearGradient
                    colors={['rgba(255, 184, 77, 0.15)', 'rgba(255, 184, 77, 0.05)']}
                    style={styles.countdownBox}
                  >
                    <Text style={styles.countdownValue}>
                      {String(timeLeft.days).padStart(2, '0')}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.countdownLabel}>Days</Text>
                </View>

                <Text style={styles.countdownSeparator}>:</Text>

                <View style={styles.countdownUnit}>
                  <LinearGradient
                    colors={['rgba(255, 184, 77, 0.15)', 'rgba(255, 184, 77, 0.05)']}
                    style={styles.countdownBox}
                  >
                    <Text style={styles.countdownValue}>
                      {String(timeLeft.hours).padStart(2, '0')}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.countdownLabel}>Hours</Text>
                </View>

                <Text style={styles.countdownSeparator}>:</Text>

                <View style={styles.countdownUnit}>
                  <LinearGradient
                    colors={['rgba(255, 184, 77, 0.15)', 'rgba(255, 184, 77, 0.05)']}
                    style={styles.countdownBox}
                  >
                    <Text style={styles.countdownValue}>
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.countdownLabel}>Mins</Text>
                </View>

                <Text style={styles.countdownSeparator}>:</Text>

                <View style={styles.countdownUnit}>
                  <LinearGradient
                    colors={['rgba(255, 184, 77, 0.15)', 'rgba(255, 184, 77, 0.05)']}
                    style={styles.countdownBox}
                  >
                    <Text style={styles.countdownValue}>
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.countdownLabel}>Secs</Text>
                </View>
              </View>
            )}

            {allZero && (
              <Text style={styles.launchedText}>
                Premium subscriptions are now available! Check the pricing page for details.
              </Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  countdownWrapper: {
    width: '100%',
  },
  gradient: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  content: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderTitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  placeholderDesc: {
    color: COLORS.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    fontSize: 16,
  },
  countdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownUnit: {
    alignItems: 'center',
    gap: 4,
  },
  countdownBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.2)',
  },
  countdownValue: {
    ...FONTS.h1,
    color: COLORS.warning,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  countdownLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownSeparator: {
    color: COLORS.warning,
    fontSize: 24,
    fontWeight: '800',
    marginTop: -20,
  },
  launchedText: {
    color: COLORS.accent,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
