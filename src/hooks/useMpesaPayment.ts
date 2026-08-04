import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
  initiateSTKPush,
  waitForPayment,
  type MpesaPaymentStatus,
  type MpesaSubscriptionIntent,
} from '../services/mpesaService';
import { formatPrice } from '../utils/currency';
import { CurrencyCode } from '../constants/types';

export type PaymentStep =
  | 'idle'
  | 'confirm'
  | 'sending'
  | 'waiting_pin'
  | 'success'
  | 'error';

export interface PaymentState {
  step: PaymentStep;
  checkoutRequestId?: string;
  errorMessage?: string;
  mpesaReceiptNumber?: string;
}

export interface UseMpesaPaymentOptions {
  /** App/merchant name shown in STK Push prompt */
  appName?: string;
  /** Backend server URL override */
  serverUrl?: string;
}

/**
 * Hook that manages the full M-Pesa STK Push payment flow:
 *   1. User confirms payment → shows amount prompt
 *   2. Sends STK Push request → "Check your phone for M-Pesa PIN prompt"
 *   3. Polls for payment status → shows success/failure
 */
export function useMpesaPayment(options: UseMpesaPaymentOptions = {}) {
  const [state, setState] = useState<PaymentState>({ step: 'idle' });
  const pollRef = useRef<{ cancel: () => void } | null>(null);

  const reset = useCallback(() => {
    if (pollRef.current) {
      pollRef.current.cancel();
    }
    setState({ step: 'idle' });
  }, []);

  /**
   * Start payment flow: confirm → STK Push → wait for PIN
   */
  const startPayment = useCallback(
    async ({
      phoneNumber,
      amount,
      currency,
      planName,
      accountReference,
      subscription,
    }: {
      phoneNumber: string;
      amount: number;
      currency: CurrencyCode;
      planName: string;
      accountReference?: string;
      subscription?: MpesaSubscriptionIntent;
    }) => {
      // Show confirmation
      setState({ step: 'confirm' });

      const formattedAmount = formatPrice(amount, currency);
      const appName = options.appName || 'HAMA';

      return new Promise<void>((resolve, reject) => {
        Alert.alert(
          'Confirm Payment',
          `You are about to pay ${appName} ${formattedAmount} for ${planName} subscription.\n\nM-Pesa will be sent to ${phoneNumber}.\n\nProceed?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => { setState({ step: 'idle' }); reject(new Error('Cancelled')); } },
            {
              text: 'Pay Now',
              style: 'default',
              onPress: async () => {
                try {
                  // Initiate STK Push
                  setState({ step: 'sending' });
                  const response = await initiateSTKPush({
                    phoneNumber,
                    amount,
                    accountReference: accountReference || `${appName}-${planName.replace(/\s+/g, '')}`,
                    transactionDesc: `${appName} ${planName} Subscription`,
                    subscription,
                  });

                  if (!response.success || !response.checkoutRequestId) {
                    setState({
                      step: 'error',
                      errorMessage: response.error || 'Payment initiation failed',
                    });
                    reject(new Error(response.error || 'Payment initiation failed'));
                    return;
                  }

                  // Waiting for PIN
                  setState({
                    step: 'waiting_pin',
                    checkoutRequestId: response.checkoutRequestId,
                  });

                  // Poll for completion
                  pollRef.current = waitForPayment(
                    response.checkoutRequestId,
                    (status) => {
                      // Update status while polling
                    },
                    (status) => {
                      // Completed
                      setState({
                        step: 'success',
                        checkoutRequestId: status.payment?.checkoutRequestId,
                        mpesaReceiptNumber: status.payment?.mpesaReceiptNumber,
                      });
                      resolve();
                    },
                    (error) => {
                      // Failed
                      setState({
                        step: 'error',
                        errorMessage: error,
                      });
                      reject(new Error(error));
                    }
                  );
                } catch (err) {
                  setState({
                    step: 'error',
                    errorMessage: err instanceof Error ? err.message : 'Payment failed',
                  });
                  reject(err);
                }
              },
            },
          ]
        );
      });
    },
    [options.appName]
  );

  /**
   * Retry after an error
   */
  const retry = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  return {
    ...state,
    isProcessing: state.step === 'sending' || state.step === 'waiting_pin',
    startPayment,
    reset,
    retry,
  };
}
