/**
 * PaymentSuccessModal
 *
 * Animated success confirmation shown after a payment completes.
 * Uses spring animations for the checkmark (Apple-style) and
 * staggered fades for text elements.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  onClose,
  message = 'Now you have access to all features',
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      titleFade.setValue(0);
      subtitleFade.setValue(0);
      buttonFade.setValue(0);

      // Staggered entrance
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(titleFade, { toValue: 1, duration: 250, delay: 100, useNativeDriver: true }).start(() => {
          Animated.timing(subtitleFade, { toValue: 1, duration: 250, delay: 100, useNativeDriver: true }).start(() => {
            Animated.timing(buttonFade, { toValue: 1, duration: 250, delay: 150, useNativeDriver: true }).start();
          });
        });
      });

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, paddingBottom: insets.bottom + 24 }]}>
          {/* Success Checkmark */}
          <Animated.View
            style={[
              styles.checkContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.success, '#34D399']}
              style={styles.checkGradient}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, { opacity: titleFade }]}>
            Successful!
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, { opacity: subtitleFade }]}>
            {message}
          </Animated.Text>

          {/* Continue Button */}
          <Animated.View style={{ opacity: buttonFade, width: '100%' }}>
            <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: SPACING.md,
  },
  checkContainer: {
    marginBottom: SPACING.sm,
  },
  checkGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
