import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

/** Union of M-Pesa, Paystack, and Stripe payment steps */
export type PaymentStep =
  | 'idle'
  | 'confirm'
  | 'sending'
  | 'waiting_pin'
  | 'paystack_checkout'
  | 'loading_key'
  | 'creating_intent'
  | 'initializing_sheet'
  | 'ready'
  | 'presenting'
  | 'verifying'
  | 'success'
  | 'error';

export type PaymentMethod = 'mpesa' | 'paystack' | 'stripe';

interface PaymentModalProps {
  visible: boolean;
  step: PaymentStep;
  method?: PaymentMethod;
  checkoutRequestId?: string;
  transactionRef?: string;
  errorMessage?: string;
  mpesaReceiptNumber?: string;
  paymentChannel?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  step,
  method = 'mpesa',
  checkoutRequestId,
  transactionRef,
  errorMessage,
  mpesaReceiptNumber,
  paymentChannel,
  onRetry,
  onClose,
}) => {
  const isMpesa = method === 'mpesa';
  const isStripe = method === 'stripe';
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.98)']}
          style={styles.container}
        >
          {/* Sending / Initializing */}
          {step === 'sending' && (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={styles.title}>
                {isMpesa ? 'Initiating M-Pesa...' : isStripe ? 'Setting up Stripe...' : 'Initiating Paystack...'}
              </Text>
              <Text style={styles.subtitle}>
                {isMpesa
                  ? 'Sending STK Push request to your phone'
                  : isStripe
                  ? 'Preparing secure payment sheet'
                  : 'Setting up secure payment page'}
              </Text>
            </View>
          )}

          {/* M-Pesa: Waiting for PIN */}
          {step === 'waiting_pin' && (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="phone-portrait-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Check Your Phone</Text>
              <Text style={styles.subtitle}>
                Enter your M-Pesa PIN on the prompt sent to your phone
              </Text>
              {checkoutRequestId && (
                <Text style={styles.txnId}>
                  Ref: {checkoutRequestId.slice(0, 8)}...
                </Text>
              )}
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: SPACING.md }}
              />
              <Text style={styles.waitingText}>
                Waiting for confirmation...
              </Text>
            </View>
          )}

          {/* Paystack: Verifying */}
          {step === 'verifying' && (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
              <Text style={styles.title}>Verifying Payment</Text>
              <Text style={styles.subtitle}>
                Confirming your payment with Paystack...
              </Text>
              {transactionRef && (
                <Text style={styles.txnId}>
                  Ref: {transactionRef.slice(0, 12)}...
                </Text>
              )}
            </View>
          )}

          {/* Success */}
          {step === 'success' && (
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.successIcon]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
              </View>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.subtitle}>
                Your subscription has been activated
              </Text>
              {mpesaReceiptNumber && (
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptLabel}>M-Pesa Receipt</Text>
                  <Text style={styles.receiptNumber}>{mpesaReceiptNumber}</Text>
                </View>
              )}
              {paymentChannel && (
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>
                  <Text style={styles.receiptNumber}>
                    {paymentChannel === 'ussd'
                      ? 'M-Pesa'
                      : paymentChannel.charAt(0).toUpperCase() +
                        paymentChannel.slice(1)}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Error */}
          {step === 'error' && (
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.errorIcon]}>
                <Ionicons name="close-circle" size={64} color="#FF4D6A" />
              </View>
              <Text style={styles.title}>Payment Failed</Text>
              <Text style={styles.subtitle}>
                {errorMessage || 'Something went wrong. Please try again.'}
              </Text>
              <View style={styles.buttonRow}>
                {onRetry && (
                  <TouchableOpacity
                    style={[styles.button, styles.retryButton]}
                    onPress={onRetry}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.button} onPress={onClose}>
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '85%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  successIcon: {
    backgroundColor: 'rgba(0,212,170,0.1)',
  },
  errorIcon: {
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  title: {
    ...FONTS.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  txnId: {
    color: colors.textTertiary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  waitingText: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 4,
  },
  receiptBox: {
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.sm,
  },
  receiptLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  receiptNumber: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  button: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
