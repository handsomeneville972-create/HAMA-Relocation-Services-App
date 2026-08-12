/**
 * TrialEndedModal
 *
 * 3-step renewal flow shown when a seeker's 7-day free trial has ended
 * or their paid subscription has expired.
 *
 * Step 1 (Renewal): Plan info + KSh 170 + "Pay" / "Nah, not today"
 * Step 2 (Miss-out): Feature loss list + "Pay now" / "Am good"
 * Step 3 (Phone): M-Pesa STK push flow
 * Step 4 (Success): Animated confirmation
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

type Step = 'renewal' | 'missout' | 'phone' | 'success';

const MISS_OUT_FEATURES = [
  "You won't see featured properties",
  "You won't see featured products",
  "You won't shop for the best products in Kenya",
  "You won't be notified on best house deals in the market",
  "You won't have access to the community and enjoy the feed with friends",
];

interface TrialEndedModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TrialEndedModal: React.FC<TrialEndedModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const mpesa = useMpesaPayment();
  const [step, setStep] = useState<Step>('renewal');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStep('renewal');
      setPhoneNumber('');
      setShowSuccess(false);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const transitionTo = (nextStep: Step) => {
    Animated.timing(contentFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      contentFade.setValue(0);
      Animated.timing(contentFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handlePaymentSuccess = async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await recordSubscription({
      planId: 'sub2',
      tier: 'Premium',
      userType: 'seeker',
      price: 170,
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
    setStep('phone');
    mpesa.startPayment({
      phoneNumber: '0' + phoneNumber,
      amount: 170,
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
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.sheet,
              { opacity: fadeAnim, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.handle} />

            <Animated.View style={{ opacity: contentFade, width: '100%' }}>
              {/* ========== STEP 1: RENEWAL ========== */}
              {step === 'renewal' && (
                <>
                  <View style={styles.headerRow}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="time-outline" size={28} color={COLORS.primary} />
                    </View>
                  </View>

                  <Text style={styles.title}>Your free trial has ended</Text>
                  <Text style={styles.subtitle}>
                    Subscribe to our plan of only KSh 170 to continue enjoying Hama's great features!
                  </Text>

                  {/* Plan Card */}
                  <View style={styles.planCard}>
                    <View style={styles.planIconWrap}>
                      <Ionicons name="diamond" size={22} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>Premium</Text>
                      <Text style={styles.planDesc}>Full access to all house seeker features</Text>
                    </View>
                    <View style={styles.planPriceWrap}>
                      <Text style={styles.planPrice}>KSh 170</Text>
                      <Text style={styles.planPeriod}>/month</Text>
                    </View>
                  </View>

                  {/* Pay Button */}
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => transitionTo('phone')}
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

                  {/* Nah, not today */}
                  <TouchableOpacity
                    style={styles.nahButton}
                    onPress={() => transitionTo('missout')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.nahText}>Nah, not today</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ========== STEP 2: MISS-OUT LIST ========== */}
              {step === 'missout' && (
                <>
                  <View style={styles.headerRow}>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
                      <Ionicons name="alert-circle-outline" size={28} color={COLORS.error} />
                    </View>
                  </View>

                  <Text style={styles.title}>
                    If I were you I would've subscribed. Here's what you'll miss out on:
                  </Text>

                  <View style={styles.featureList}>
                    {MISS_OUT_FEATURES.map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <Text style={styles.featureNumber}>{index + 1}—</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.happyText}>
                    But hey, at least you'll get to explore neighborhoods.
                  </Text>

                  {/* Pay Now Button */}
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => transitionTo('phone')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[COLORS.success, '#34D399']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payGradient}
                    >
                      <Text style={styles.payText}>Pay now</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Am good */}
                  <TouchableOpacity
                    style={styles.amGoodButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                    <Text style={styles.amGoodText}>Am good</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ========== STEP 3: PHONE INPUT ========== */}
              {step === 'phone' && (
                <>
                  <View style={styles.headerRow}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="phone-portrait-outline" size={28} color={COLORS.success} />
                    </View>
                  </View>

                  <Text style={styles.title}>Pay KSh 170</Text>
                  <Text style={styles.subtitle}>Enter your M-Pesa phone number</Text>

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
                      <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                      <Text style={styles.payText}>Pay with M-Pesa</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => transitionTo('renewal')}
                  >
                    <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
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
          onClose();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    maxHeight: '88%',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,107,0,0.06)',
    borderWidth: 1,
    borderColor: `${COLORS.primary}80`,
    marginBottom: SPACING.lg,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  planDesc: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  planPriceWrap: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  planPeriod: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  payButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nahButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  nahText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  featureList: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 4,
  },
  featureNumber: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  happyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  amGoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  amGoodText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
