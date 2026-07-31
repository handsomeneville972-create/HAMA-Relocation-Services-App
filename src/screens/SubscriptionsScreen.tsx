import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PricingCard } from '../components/PricingCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PaymentModal } from '../components/PaymentModal';
import { PaystackWebView } from '../components/PaystackWebView';
import { EarlyAccessBadge } from '../components/EarlyAccessBadge';
import { EarlyAccessCountdown } from '../components/EarlyAccessCountdown';
import { ReferralProgram } from '../components/ReferralProgram';
import { EmailCaptureForm } from '../components/EmailCaptureForm';
import { useMpesaPayment } from '../hooks/useMpesaPayment';
import { usePaystackPayment } from '../hooks/usePaystackPayment';
import { useStripePayment } from '../hooks/useStripePayment';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { getSubscriptionPlans } from '../services/subscriptionService';
import { formatPrice } from '../utils/currency';
import { trackFreemiumUpgradeClicked, trackFreemiumPlanViewed, trackSubscriptionInterest } from '../utils/analytics';
import { isSubscriptionPaymentEnabled } from '../config/earlyAccess';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { UserType, SubscriptionPlan } from '../constants/types';

const USER_TYPES: { key: UserType; label: string; icon: string }[] = [
  { key: 'seeker', label: 'House Seeker', icon: 'home-outline' },
  { key: 'landlord', label: 'Landlord', icon: 'business-outline' },
  { key: 'seller', label: 'Seller', icon: 'cart-outline' },
  { key: 'service_provider', label: 'Service Provider', icon: 'construct-outline' },
];

type PaymentMethod = 'mpesa' | 'paystack' | 'stripe' | null;

export const SubscriptionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { showPremiumModal, showWaitlist } = useEarlyAccess();
  const paymentEnabled = isSubscriptionPaymentEnabled();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('seeker');
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  // M-Pesa state
  const [phoneNumber, setPhoneNumber] = useState('');

  // Paystack state
  const [email, setEmail] = useState('');

  const mpesa = useMpesaPayment();
  const paystack = usePaystackPayment();
  const stripe = useStripePayment();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await getSubscriptionPlans();
      if (data) setAllPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  // Track plan views for analytics
  useEffect(() => {
    if (!loading && plans.length > 0) {
      plans.forEach(plan => {
        trackFreemiumPlanViewed(plan.tier, plan.userType);
      });
    }
  }, [selectedUserType, loading]);

  const plans = allPlans.filter(p => p.userType === selectedUserType);

  // Determine which payment flow is active
  const isPaying = mpesa.step !== 'idle' || paystack.step !== 'idle' || stripe.step !== 'idle';
  const isPaystackCheckout = paystack.step === 'paystack_checkout';

  /** Reset everything and close payment sheets */
  const closeAll = useCallback(() => {
    setShowPaymentSheet(false);
    setSelectedPlan(null);
    setPaymentMethod(null);
    setPhoneNumber('');
    setEmail('');
    mpesa.reset();
    paystack.reset();
    stripe.reset();
  }, [mpesa, paystack, stripe]);

  /** Handle successful payment */
  const handlePaymentSuccess = useCallback(() => {
    Alert.alert('Welcome!', 'Your subscription has been activated successfully!');
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <EarlyAccessBadge variant="pill" />
        </View>
        <Text style={styles.headerSubtitle}>Choose the plan that fits your needs</Text>
      </LinearGradient>

      {/* User Type Tabs */}
      <View style={styles.userTypeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userTypeScroll}>
          {USER_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.userTypeTab, selectedUserType === type.key && styles.userTypeTabActive]}
              onPress={() => setSelectedUserType(type.key)}
            >
              <Ionicons
                name={type.icon as any}
                size={18}
                color={selectedUserType === type.key ? '#fff' : COLORS.textTertiary}
              />
              <Text style={[styles.userTypeLabel, selectedUserType === type.key && styles.userTypeLabelActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Early Access Benefit Active banner */}
      {!paymentEnabled && (
        <View style={styles.freemiumBanner}>
          <LinearGradient
            colors={['rgba(255, 107, 0, 0.08)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.freemiumBannerGradient}
          >
            <Ionicons name="star" size={18} color={COLORS.primary} />
            <View style={styles.freemiumBannerTextContainer}>
              <Text style={styles.freemiumBannerTitle}>Early Access Benefit Active</Text>
              <Text style={styles.freemiumBannerText}>
                You currently receive complimentary access to all premium features included in these plans.
                Enjoy full functionality while Early Access is active.
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Countdown placeholder */}
      <View style={styles.countdownContainer}>
        <EarlyAccessCountdown />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader type="pricing-card" count={3} />
          </View>
        ) : (
          <>
            {/* Commission Info */}
            <View style={styles.commissionBanner}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,107,0,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.commissionGradient}>
                <View style={styles.commissionContent}>
                  <Ionicons name="information-circle" size={22} color={COLORS.secondary} />
                  <View style={styles.commissionText}>
                    <Text style={styles.commissionTitle}>Marketplace Commission</Text>
                    <Text style={styles.commissionDesc}>5% per completed sale • 10-15% per service booking</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Pricing Plans */}
            <View style={styles.plansContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plansScroll}>
                {plans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => {
                      if (plan.price === 0) {
                        Alert.alert('Free Plan', 'Your free plan has been activated!');
                      } else if (paymentEnabled) {
                        setSelectedPlan(plan);
                        setShowPaymentSheet(true);
                        setPaymentMethod(null);
                      } else {
                        // During Early Access — show premium modal + track interest
                        trackFreemiumUpgradeClicked('pricing_card', plan.tier);
                        trackSubscriptionInterest(plan.tier, plan.userType);
                        showPremiumModal();
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Feature Comparison */}
            {plans.length > 0 && (
              <View style={styles.featureComparison}>
                <Text style={styles.comparisonTitle}>Compare Plans</Text>
                {/* Join Priority Access + Referral Program */}
            {!paymentEnabled && (                <View style={styles.engagementSection}>
                <TouchableOpacity
                  style={styles.priorityAccessBtn}
                  onPress={showWaitlist}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.priorityAccessGrad}
                  >
                    <Ionicons name="notifications" size={22} color="#fff" />
                    <View style={styles.priorityAccessText}>
                      <Text style={styles.priorityAccessTitle}>Join Priority Access List</Text>
                      <Text style={styles.priorityAccessDesc}>Be first to know about new features and updates</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <EmailCaptureForm compact message="Stay updated on new features, platform expansions, and exclusive early releases." />
              </View>
            )}

            {/* Feature Comparison */}
            {plans[0]?.features?.map((feature, index) => (
                  <View key={index} style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>{feature}</Text>
                    <View style={styles.comparisonChecks}>
                      {plans.map((plan, pi) => (
                        <View key={pi} style={styles.comparisonCell}>
                          {plan.features?.includes(feature) ? (
                            <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                          ) : (
                            <Ionicons name="close" size={20} color={COLORS.textTertiary} />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {/* Referral Program (full version) */}
        {!paymentEnabled && (
          <View style={styles.referralSection}>
            <ReferralProgram />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== PAYMENT METHOD SELECTOR + INPUT SHEET ===== */}
      {showPaymentSheet && selectedPlan && !isPaying && (
        <View style={styles.paymentOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.98)', 'rgba(0,0,0,0.99)']}
            style={styles.paymentSheet}
          >
            <TouchableOpacity style={styles.paymentClose} onPress={closeAll}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <Ionicons name="star-outline" size={40} color={COLORS.primary} />
            <Text style={styles.paymentTitle}>
              Subscribe to {selectedPlan.tier}
            </Text>
            <Text style={styles.paymentSubtitle}>
              {formatPrice(selectedPlan.price, selectedPlan.currency)}/month
            </Text>

            {/* Payment Method Selection */}
            {!paymentMethod ? (
              <>
                <Text style={styles.chooseMethodTitle}>Choose payment method</Text>

                {/* M-Pesa Option */}
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => setPaymentMethod('mpesa')}
                >
                  <View style={[styles.methodIcon, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                    <Ionicons name="phone-portrait-outline" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>M-Pesa</Text>
                    <Text style={styles.methodDesc}>Pay via M-Pesa STK Push</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>

                {/* Paystack Option */}
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => setPaymentMethod('paystack')}
                >
                  <View style={[styles.methodIcon, { backgroundColor: 'rgba(0,212,170,0.15)' }]}>
                    <Ionicons name="card-outline" size={24} color={COLORS.accent} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>Paystack</Text>
                    <Text style={styles.methodDesc}>Pay with card or M-Pesa</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>

                {/* Stripe Option */}
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => setPaymentMethod('stripe')}
                >
                  <View style={[styles.methodIcon, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                    <Ionicons name="logo-usd" size={24} color={COLORS.info} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>Stripe</Text>
                    <Text style={styles.methodDesc}>Pay with international card (USD, EUR, GBP)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Back button */}
                <TouchableOpacity
                  style={styles.backToMethods}
                  onPress={() => setPaymentMethod(null)}
                >
                  <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.backToMethodsText}>Change method</Text>
                </TouchableOpacity>

                {/* M-Pesa: Phone Input */}
                {paymentMethod === 'mpesa' && (
                  <>
                    <View style={styles.inputSection}>
                      <Ionicons name="phone-portrait-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.inputLabel}>
                        Enter your M-Pesa phone number
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
                    </View>

                    <TouchableOpacity
                      style={[styles.payButton, (!phoneNumber || phoneNumber.length < 9) && styles.payButtonDisabled]}
                      disabled={!phoneNumber || phoneNumber.length < 9}
                      onPress={() => {
                        setShowPaymentSheet(false);
                        mpesa.startPayment({
                          phoneNumber: '0' + phoneNumber,
                          amount: selectedPlan.price,
                          currency: selectedPlan.currency,
                          planName: `${selectedPlan.tier} - ${selectedPlan.userType}`,
                          accountReference: `HAMA-${selectedPlan.tier}-${selectedPlan.userType}`,
                        });
                      }}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payButtonGradient}
                      >
                        <Text style={styles.payButtonText}>
                          Pay {formatPrice(selectedPlan.price, selectedPlan.currency)}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                      You will receive an M-Pesa prompt on your phone to enter your PIN
                    </Text>
                  </>
                )}

                {/* Stripe: No input needed — native PaymentSheet handles everything */}
                {paymentMethod === 'stripe' && (
                  <>
                    <View style={styles.inputSection}>
                      <Ionicons name="logo-usd" size={32} color={COLORS.info} />
                      <Text style={styles.inputLabel}>
                        Pay with any international card via Stripe
                      </Text>
                      <View style={styles.stripeCardPreview}>
                        <Ionicons name="card-outline" size={20} color={COLORS.textTertiary} />
                        <Text style={styles.stripeCardText}>
                          Visa • Mastercard • Amex • Discover
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => {
                        setShowPaymentSheet(false);
                        stripe.startPayment({
                          amount: selectedPlan.price,
                          currency: selectedPlan.currency,
                          planName: `${selectedPlan.tier} - ${selectedPlan.userType}`,
                          metadata: {
                            plan_id: selectedPlan.id,
                            user_type: selectedPlan.userType,
                            tier: selectedPlan.tier,
                          },
                        });
                      }}
                    >
                      <LinearGradient
                        colors={['#FF6B00', '#FF8A33']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payButtonGradient}
                      >
                        <Text style={styles.payButtonText}>
                          Pay {formatPrice(selectedPlan.price, selectedPlan.currency)} with Stripe
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                      Secure payment powered by Stripe — your card details never touch our servers
                    </Text>
                  </>
                )}

                {/* Paystack: Email Input */}
                {paymentMethod === 'paystack' && (
                  <>
                    <View style={styles.inputSection}>
                      <Ionicons name="mail-outline" size={32} color={COLORS.accent} />
                      <Text style={styles.inputLabel}>
                        Enter your email for the payment receipt
                      </Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[styles.textInput, { paddingLeft: 16 }]}
                          placeholder="your@email.com"
                          placeholderTextColor={COLORS.textTertiary}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.payButton, !email && styles.payButtonDisabled]}
                      disabled={!email || !email.includes('@')}
                      onPress={() => {
                        setShowPaymentSheet(false);
                        paystack.startPayment({
                          email,
                          amount: selectedPlan.price,
                          currency: selectedPlan.currency,
                          planName: `${selectedPlan.tier} - ${selectedPlan.userType}`,
                          metadata: {
                            plan_id: selectedPlan.id,
                            user_type: selectedPlan.userType,
                            tier: selectedPlan.tier,
                          },
                        });
                      }}
                    >
                      <LinearGradient
                        colors={['#00D4AA', '#00D4AA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payButtonGradient}
                      >
                        <Text style={styles.payButtonText}>
                          Pay {formatPrice(selectedPlan.price, selectedPlan.currency)} with Paystack
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                      Secure payment via card or M-Pesa through Paystack
                    </Text>
                  </>
                )}
              </>
            )}
          </LinearGradient>
        </View>
      )}

      {/* ===== PAYSTACK WEBVIEW CHECKOUT ===== */}
      <PaystackWebView
        visible={isPaystackCheckout}
        authorizationUrl={paystack.authorizationUrl || ''}
        reference={paystack.reference || ''}
        onSuccess={(ref) => {
          paystack.onCheckoutSuccess(ref);
        }}
        onCancel={() => {
          paystack.onCheckoutCancel();
        }}
        onError={(error) => {
          paystack.onCheckoutError(error);
        }}
        onClose={closeAll}
      />

      {/* ===== PAYMENT STATUS MODAL (shared) ===== */}
      {/* M-Pesa Payment Modal */}
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

      {/* Paystack Payment Modal */}
      <PaymentModal
        visible={paystack.step !== 'idle' && paystack.step !== 'confirm' && paystack.step !== 'paystack_checkout'}
        step={paystack.step}
        method="paystack"
        transactionRef={paystack.reference}
        paymentChannel={paystack.paymentChannel}
        errorMessage={paystack.errorMessage}
        onRetry={paystack.retry}
        onClose={() => {
          paystack.reset();
          if (paystack.step === 'success') {
            handlePaymentSuccess();
          }
        }}
      />

      {/* Stripe Payment Modal */}
      <PaymentModal
        visible={stripe.step !== 'idle' && stripe.step !== 'ready' && stripe.step !== 'presenting'}
        step={stripe.step === 'presenting' ? 'verifying' : stripe.step}
        method="stripe"
        transactionRef={stripe.paymentIntentId}
        errorMessage={stripe.errorMessage}
        onRetry={stripe.retry}
        onClose={() => {
          stripe.reset();
          if (stripe.step === 'success') {
            handlePaymentSuccess();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 20,
    gap: 12,
  },

  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  userTypeBar: {
    marginBottom: SPACING.md,
  },
  userTypeScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  userTypeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  userTypeTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  userTypeLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  userTypeLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  commissionBanner: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  commissionGradient: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  commissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
  },
  commissionText: {
    flex: 1,
  },
  commissionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  commissionDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  plansContainer: {
    marginBottom: SPACING.lg,
  },
  plansScroll: {
    paddingHorizontal: SPACING.md,
  },
  featureComparison: {
    paddingHorizontal: SPACING.md,
  },
  // Early Access Benefit banner
  freemiumBanner: {
    marginBottom: SPACING.sm,
  },
  freemiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  freemiumBannerTextContainer: {
    flex: 1,
  },
  freemiumBannerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  freemiumBannerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  countdownContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  // Engagement & Waitlist
  engagementSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: 12,
  },
  priorityAccessBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  priorityAccessGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.lg,
  },
  priorityAccessText: {
    flex: 1,
  },
  priorityAccessTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  priorityAccessDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  referralSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  comparisonTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    paddingVertical: 12,
  },
  comparisonFeature: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  comparisonChecks: {
    flexDirection: 'row',
    gap: 20,
  },
  comparisonCell: {
    width: 60,
    alignItems: 'center',
  },
  // ===== Payment Method Selector =====
  paymentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  paymentSheet: {
    width: '88%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    maxHeight: '85%',
  },
  paymentClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  paymentTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  paymentSubtitle: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -4,
  },
  chooseMethodTitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.sm,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  methodDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  backToMethods: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backToMethodsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  inputSection: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    width: '100%',
  },
  inputPrefix: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 16,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 16,
  },
  payButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  stripeCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stripeCardText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
