/**
 * LandlordSubscriptionModal
 *
 * Shown after a landlord exceeds their 3 free property uploads.
 * Presents the 3 subscription plans (Basic/Premium/Pro) with STK push.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlansForRole } from '../constants/plans';
import { useMpesaPayment } from '../hooks/useMpesaPayment';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { PaymentModal } from './PaymentModal';
import { recordSubscription } from '../utils/subscriptionStore';
import { purchaseSubscription } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import type { SubscriptionPlan } from '../constants/types';
import { formatPrice } from '../utils/currency';

interface LandlordSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LandlordSubscriptionModal: React.FC<LandlordSubscriptionModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const mpesa = useMpesaPayment();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const landlordPlans = getPlansForRole('landlord');

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      setSelectedPlan(null);
      setPhoneNumber('');
      setShowSuccess(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await recordSubscription({
      planId: selectedPlan.id,
      tier: selectedPlan.tier,
      userType: 'landlord',
      price: selectedPlan.price,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt,
    });
    if (currentUserId) {
      await purchaseSubscription({ userId: currentUserId, planId: selectedPlan.id }).catch(() => {});
    }
    setShowSuccess(true);
  };

  const startStk = () => {
    if (!selectedPlan) return;
    if (phoneNumber.replace(/[^0-9]/g, '').length < 9) return;
    mpesa.startPayment({
      phoneNumber: '0' + phoneNumber,
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      planName: `${selectedPlan.tier} - landlord`,
      accountReference: `HAMA-${selectedPlan.tier}-landlord`,
      subscription: {
        userId: currentUserId || 'guest',
        tier: selectedPlan.tier,
        userType: 'landlord',
      },
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Animated.View style={[styles.sheet, { opacity: fadeAnim, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />

            {!selectedPlan ? (
              <>
                {/* Plan Selection */}
                <View style={styles.headerRow}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="diamond" size={28} color={COLORS.primary} />
                  </View>
                </View>

                <Text style={styles.title}>Choose Your Plan</Text>
                <Text style={styles.subtitle}>Select a plan to continue listing properties on Hama</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.plansList}>
                  {landlordPlans.filter(p => p.tier !== 'Free').map((plan) => {
                    const highlighted = plan.highlighted;
                    return (
                      <TouchableOpacity
                        key={plan.id}
                        activeOpacity={0.85}
                        onPress={() => setSelectedPlan(plan)}
                        style={[styles.planRow, highlighted && styles.planRowHighlighted]}
                      >
                        <View style={[styles.planIcon, { backgroundColor: highlighted ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                          <Ionicons name={highlighted ? 'diamond' : 'sparkles-outline'} size={20} color={highlighted ? COLORS.primary : COLORS.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.planTitleRow}>
                            <Text style={styles.planName}>{plan.tier}</Text>
                            {highlighted && (
                              <View style={styles.popTag}>
                                <Text style={styles.popTagText}>Most Popular</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.planDesc} numberOfLines={1}>
                            {plan.features[0]}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.planPrice, highlighted && { color: COLORS.primary }]}>
                            {formatPrice(plan.price, plan.currency)}
                          </Text>
                          <Text style={styles.planPeriod}>/month</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={highlighted ? COLORS.primary : COLORS.textTertiary} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Motivational comment */}
                <Text style={styles.motivationalText}>
                  Many property owners paid now, why not you!
                </Text>

                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>Maybe later</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Phone Input */}
                <View style={styles.headerRow}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="phone-portrait-outline" size={28} color={COLORS.success} />
                  </View>
                </View>

                <Text style={styles.title}>Pay {formatPrice(selectedPlan.price, selectedPlan.currency)}</Text>
                <Text style={styles.subtitle}>Enter your M-Pesa phone number for {selectedPlan.tier}</Text>

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

                <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedPlan(null)}>
                  <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.backText}>Back to plans</Text>
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
        message="Your subscription is active! You can now list more properties."
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
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  plansList: {
    flexGrow: 0,
    maxHeight: 320,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  planRowHighlighted: {
    borderColor: `${COLORS.primary}80`,
    backgroundColor: 'rgba(255,107,0,0.06)',
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  popTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,107,0,0.18)',
  },
  popTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  planPrice: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  planPeriod: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  motivationalText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontFamily: 'serif',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtnText: {
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
  backBtn: {
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
