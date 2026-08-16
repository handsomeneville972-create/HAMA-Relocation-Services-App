/**
 * PaywallOverlay
 *
 * Blurred paywall shown to non-subscribed seekers when they try to access
 * gated features (Marketplace, Services, property/product cards, See All).
 * Shows the pay message with "Pay" and "Nah. am good" buttons.
 * Pay triggers M-Pesa STK push flow.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMpesaPayment } from '../hooks/useMpesaPayment';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { PaymentModal } from './PaymentModal';
import { recordSubscription } from '../utils/subscriptionStore';
import { purchaseSubscription } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface PaywallOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  /** Optional custom message override */
  message?: string;
}

export const PaywallOverlay: React.FC<PaywallOverlayProps> = ({
  visible,
  onDismiss,
  message = "YOU CURRENTLY HAVE NO ACCESS TO THIS FEATURE AND MANY OTHERS. PAY KSH 199 TO UNLOCK ALL FEATURES!",
}) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const mpesa = useMpesaPayment();
  const [showPhone, setShowPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      cardSlide.setValue(30);
      setShowPhone(false);
      setPhoneNumber('');
      setShowSuccess(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handlePaymentSuccess = async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await recordSubscription({
      planId: 'sub2',
      tier: 'Premium',
      userType: 'seeker',
      price: 199,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt,
    });
    if (currentUserId) {
      await purchaseSubscription({ userId: currentUserId, planId: 'sub2' }).catch(() => {});
    }
    setShowSuccess(true);
  };

  const startStk = () => {
    if (phoneNumber.replace(/[^0-9]/g, '').length < 9) return;
    setShowPhone(false);
    mpesa.startPayment({
      phoneNumber: '0' + phoneNumber,
      amount: 199,
      currency: 'KSh',
      planName: 'Premium - seeker',
      accountReference: 'HAMA-Premium-seeker',
      subscription: {
        userId: currentUserId || 'guest',
        tier: 'Premium',
        userType: 'seeker',
      },
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: cardSlide }], paddingBottom: insets.bottom + 20 },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
            </View>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {!showPhone ? (
              <>
                {/* Pay Button */}
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => setShowPhone(true)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.success, '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payGradient}
                  >
                    <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                    <Text style={styles.payText}>Pay</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Dismiss Button */}
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.7}>
                  <Text style={styles.dismissText}>Nah. am good</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Phone Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Enter your M-Pesa phone number</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>+254</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="712345678"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="phone-pad"
                      maxLength={9}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.payButton, (!phoneNumber || phoneNumber.length < 9) && styles.payButtonDisabled]}
                  disabled={!phoneNumber || phoneNumber.length < 9}
                  onPress={startStk}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.success, '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payGradient}
                  >
                    <Text style={styles.payText}>Pay KSh 199</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={() => setShowPhone(false)}>
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* M-Pesa Payment Status Modal */}
      <PaymentModal
        visible={mpesa.step !== 'idle' && mpesa.step !== 'confirm'}
        step={mpesa.step === 'waiting_pin' ? 'waiting_pin' : mpesa.step}
        method="mpesa"
        checkoutRequestId={mpesa.checkoutRequestId}
        errorMessage={mpesa.errorMessage}
        mpesaReceiptNumber={mpesa.mpesaReceiptNumber}
        onRetry={mpesa.retry}
        onClose={() => {
          mpesa.reset();
          if (mpesa.step === 'success') {
            handlePaymentSuccess();
          }
        }}
      />

      {/* Success Modal */}
      <PaymentSuccessModal
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onDismiss();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  payButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 10,
  },
  dismissText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    width: '100%',
    gap: 8,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
  },
  inputPrefix: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
