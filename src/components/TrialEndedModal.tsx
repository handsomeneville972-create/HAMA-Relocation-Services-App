/**
 * TrialEndedModal
 *
 * Shown when a seeker's 7-day free trial has ended and they have no active
 * subscription. Presents all seeker plan options; selecting a paid plan
 * opens the M-Pesa STK push billing flow.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlansForRole, getSeekerTrialPlan } from '../constants/plans';
import { useMpesaPayment } from '../hooks/useMpesaPayment';
import { PaymentModal } from './PaymentModal';
import { formatPrice } from '../utils/currency';
import { recordSubscription } from '../utils/subscriptionStore';
import { purchaseSubscription } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import type { SubscriptionPlan } from '../constants/types';

interface TrialEndedModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TrialEndedModal: React.FC<TrialEndedModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const mpesa = useMpesaPayment();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const seekerPlans = getPlansForRole('seeker');
  const trialPlan = getSeekerTrialPlan();

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, fadeAnim]);

  const handlePlanPress = (plan: SubscriptionPlan) => {
    if (plan.tier === 'Free') {
      Alert.alert('Free Plan', 'You can continue on the Free plan with limited features — basic search, up to 20 saved properties.');
      return;
    }
    setSelectedPlan(plan);
    setShowPhone(true);
  };

  const startStk = () => {
    if (!selectedPlan) return;
    if (phoneNumber.replace(/[^0-9]/g, '').length < 9) {
      Alert.alert('Phone Number', 'Please enter your M-Pesa phone number.');
      return;
    }
    setShowPhone(false);
    mpesa.startPayment({
      phoneNumber,
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      planName: `${selectedPlan.tier} - ${selectedPlan.userType}`,
      accountReference: `HAMA-${selectedPlan.tier}-${selectedPlan.userType}`,
      subscription: {
        userId: currentUserId || 'guest',
        tier: selectedPlan.tier,
        userType: selectedPlan.userType,
      },
    });
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await recordSubscription({
      planId: selectedPlan.id,
      tier: selectedPlan.tier,
      userType: selectedPlan.userType,
      price: selectedPlan.price,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt,
    });
    if (currentUserId) {
      await purchaseSubscription({ userId: currentUserId, planId: selectedPlan.id }).catch(() => {});
    }
    setSelectedPlan(null);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Animated.View style={[styles.sheet, { opacity: fadeAnim, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="hourglass-outline" size={28} color={COLORS.primary} />
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Your free trial has ended</Text>
            <Text style={styles.subtitle}>
              The 7-day Premium trial is over. Choose a plan to keep enjoying Premium features, or continue with the Free plan.
            </Text>

            {/* Plan options */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.plansList}>
              {seekerPlans.map((plan) => {
                const isTrialCard = plan.tier === 'Free';
                const highlighted = plan.highlighted;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (isTrialCard) {
                        handlePlanPress({ ...trialPlan, tier: 'Free', price: 0, features: trialPlan.features, highlighted: false });
                        return;
                      }
                      handlePlanPress(plan);
                    }}
                    style={[styles.planRow, highlighted && styles.planRowHighlighted]}
                  >
                    <View style={[styles.planIcon, { backgroundColor: highlighted ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                      <Ionicons
                        name={highlighted ? 'diamond' : isTrialCard ? 'flame-outline' : 'sparkles-outline'}
                        size={20}
                        color={highlighted ? COLORS.primary : COLORS.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planName}>{isTrialCard ? 'Free' : plan.tier}</Text>
                        {isTrialCard && (
                          <View style={styles.freeTag}>
                            <Text style={styles.freeTagText}>Limited</Text>
                          </View>
                        )}
                        {highlighted && (
                          <View style={styles.popTag}>
                            <Text style={styles.popTagText}>Most Popular</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planDesc} numberOfLines={1}>
                        {isTrialCard ? 'Basic search, 20 saved properties' : plan.features[0]}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.planPrice, highlighted && { color: COLORS.primary }]}>
                        {plan.price === 0 ? 'Free' : formatPrice(plan.price, plan.currency)}
                      </Text>
                      {plan.price > 0 && <Text style={styles.planPeriod}>/month</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={highlighted ? COLORS.primary : COLORS.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* M-Pesa phone entry */}
            {showPhone && selectedPlan && (
              <View style={styles.phoneSection}>
                <Text style={styles.phoneTitle}>
                  Pay {formatPrice(selectedPlan.price, selectedPlan.currency)} for {selectedPlan.tier}
                </Text>
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
                <TouchableOpacity style={styles.stkButton} onPress={startStk}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stkGradient}
                  >
                    <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                    <Text style={styles.stkText}>Pay with M-Pesa</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={() => setShowPhone(false)}>
                  <Text style={styles.backText}>Back to plans</Text>
                </TouchableOpacity>
              </View>
            )}

            {!showPhone && (
              <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
                <Text style={styles.dismissText}>Maybe later</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Payment status modal */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
  freeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  freeTagText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
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
  phoneSection: {
    marginTop: 4,
  },
  phoneTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    marginBottom: 12,
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
  stkButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  stkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  stkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  dismissText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
});
