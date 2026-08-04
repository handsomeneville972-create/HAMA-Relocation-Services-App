/**
 * M-Pesa Payment Service
 * 
 * Client-side API that communicates with the HAMA M-Pesa backend server.
 * NEVER expose Daraja API credentials on the client — all sensitive
 * operations happen server-side.
 */

// Backend server URL. Override with EXPO_PUBLIC_PAYMENT_API_URL (deployed
// server). Falls back to the dev machine's LAN IP while running locally.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_PAYMENT_API_URL ||
  (__DEV__ ? 'http://192.168.1.100:3001' : 'https://api.hama.co.ke');

export interface MpesaSubscriptionIntent {
  userId: string;
  tier: string;
  userType: string;
}

export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
  /** When paying for a subscription, the backend stores it on success */
  subscription?: MpesaSubscriptionIntent;
}

export interface MpesaPaymentResponse {
  success: boolean;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  message?: string;
  error?: string;
}

export interface MpesaPaymentStatus {
  success: boolean;
  payment?: {
    checkoutRequestId: string;
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    status: 'pending' | 'completed' | 'failed';
    mpesaReceiptNumber?: string;
    resultDesc?: string;
    createdAt: string;
    completedAt?: string;
  };
  error?: string;
}

/**
 * Initiate an M-Pesa STK Push payment
 * Sends request to backend which handles the Daraja API call
 */
export async function initiateSTKPush(
  request: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to connect to payment server',
    };
  }
}

/**
 * Check payment status from our records
 */
export async function getPaymentStatus(
  checkoutRequestId: string
): Promise<MpesaPaymentStatus> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/mpesa/status/${checkoutRequestId}`
    );
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to check payment status',
    };
  }
}

/**
 * Poll payment status until completed or failed
 * Used after initiating STK Push to wait for user to enter PIN
 */
export function waitForPayment(
  checkoutRequestId: string,
  onUpdate: (status: MpesaPaymentStatus) => void,
  onComplete: (status: MpesaPaymentStatus) => void,
  onError: (error: string) => void,
  maxAttempts = 30,
  intervalMs = 3000
): { cancel: () => void } {
  let attempts = 0;
  let cancelled = false;

  const poll = async () => {
    if (cancelled || attempts >= maxAttempts) {
      if (!cancelled) {
        onError('Payment confirmation timed out. Please check your M-Pesa messages.');
      }
      return;
    }

    attempts++;
    const status = await getPaymentStatus(checkoutRequestId);
    onUpdate(status);

    if (status.payment?.status === 'completed') {
      onComplete(status);
      return;
    }

    if (status.payment?.status === 'failed') {
      onError(status.payment.resultDesc || 'Payment failed');
      return;
    }

    setTimeout(poll, intervalMs);
  };

  poll();

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
