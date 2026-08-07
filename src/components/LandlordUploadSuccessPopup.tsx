/**
 * LandlordUploadSuccessPopup
 *
 * Shown after a landlord successfully uploads their 3rd property.
 * Informs them that free uploads are over and prompts subscription.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

interface LandlordUploadSuccessPopupProps {
  visible: boolean;
  onPay: () => void;
  onMaybeLater: () => void;
}

export const LandlordUploadSuccessPopup: React.FC<LandlordUploadSuccessPopupProps> = ({
  visible,
  onPay,
  onMaybeLater,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onMaybeLater}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
          </View>

          {/* Title */}
          <Text style={styles.title}>You have successfully uploaded your first three properties!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Your free uploads have ended. Subscribe to continue listing more properties on Hama.
          </Text>

          {/* Motivational comment */}
          <Text style={styles.motivationalText}>
            Many property owners paid now, why not you!
          </Text>

          {/* Pay Button (Green) */}
          <TouchableOpacity style={styles.payButton} onPress={onPay} activeOpacity={0.85}>
            <Text style={styles.payText}>Pay</Text>
          </TouchableOpacity>

          {/* Maybe Later Button (Red) */}
          <TouchableOpacity style={styles.maybeLaterButton} onPress={onMaybeLater} activeOpacity={0.7}>
            <Text style={styles.maybeLaterText}>Maybe later</Text>
          </TouchableOpacity>
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
    maxWidth: 360,
    gap: SPACING.md,
  },
  iconWrap: {
    marginBottom: SPACING.xs,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  motivationalText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  payButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  maybeLaterButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
  },
  maybeLaterText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
