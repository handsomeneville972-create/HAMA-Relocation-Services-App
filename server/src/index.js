/**
 * HAMA Payment Server
 * 
 * Payment Methods:
 *   1. M-Pesa STK Push (Till Number) via Safaricom Daraja API
 *   2. Paystack (Cards + M-Pesa) via Paystack API
 * 
 * API Endpoints:
 *   M-Pesa:
 *     POST /api/mpesa/stkpush     - Initiate STK Push payment
 *     POST /api/mpesa/callback    - Callback endpoint for Safaricom
 *     GET  /api/mpesa/status/:id  - Query transaction status
 *     GET  /api/mpesa/query/:id   - Query Daraja API status
 *   Paystack:
 *     POST /api/paystack/initialize  - Initialize Paystack transaction
 *     GET  /api/paystack/verify/:ref  - Verify transaction
 *   General:
 *     GET  /api/health               - Health check
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { stkPush, processCallback, queryStatus } = require('./mpesa');
const { initializeTransaction, verifyTransaction } = require('./paystack');
const { createPaymentIntent, retrievePaymentIntent, getPublishableKey } = require('./stripe');
const { activateSubscription, getActiveSubscription } = require('./subscriptions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ============================================================
// In-memory payment store (use a DB in production)
// ============================================================
const payments = new Map();
// Paystack transactions store
const paystackPayments = new Map();

// ============================================================
// POST /api/mpesa/stkpush
// Initiate an STK Push payment to the customer's phone
// ============================================================
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc, subscription } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Amount must be at least KSh 1' });
    }

    // Normalize phone number: remove 0 or +254 prefix, ensure 254XXXXXXXXX format
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
    if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;

    if (cleaned.length !== 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Use format: 07XX XXXXXX or +2547XX XXXXXX',
      });
    }

    // When the payment is for a subscription, register the intent so the
    // callback can store the subscription. AccountReference is limited to
    // 12 characters, so we use a short generated reference as the lookup key.
    let subscriptionIntent = null;
    let ref = accountReference || `HAMA-${Date.now()}`;
    if (subscription && (subscription.userId || subscription.userType)) {
      subscriptionIntent = {
        userId: String(subscription.userId || ''),
        tier: String(subscription.tier || 'Premium'),
        userType: String(subscription.userType || 'seeker'),
      };
      ref = `HAMA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    // Initiate STK Push
    const result = await stkPush({
      phoneNumber: cleaned,
      amount,
      accountReference: ref,
      transactionDesc: transactionDesc || 'HAMA Payment',
    });

    // Store payment record
    payments.set(result.CheckoutRequestID, {
      checkoutRequestId: result.CheckoutRequestID,
      phoneNumber: cleaned,
      amount,
      accountReference: ref,
      transactionDesc,
      subscription: subscriptionIntent,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    console.log(`[STK Push] Initiated: ${result.CheckoutRequestID} for KSh ${amount} to ${cleaned}${subscriptionIntent ? ` (${subscriptionIntent.tier} / ${subscriptionIntent.userType} / ${subscriptionIntent.userId})` : ''}`);

    res.json({
      success: true,
      checkoutRequestId: result.CheckoutRequestID,
      responseCode: result.ResponseCode,
      responseDescription: result.ResponseDescription,
      message: 'Check your phone to enter M-Pesa PIN',
    });
  } catch (err) {
    console.error('[STK Push] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// POST /api/mpesa/callback
// Safaricom calls this after user enters PIN (or cancels)
// ============================================================
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const result = processCallback(req.body);

    console.log('[Callback] Received:', result.checkoutRequestId, '- Success:', result.success);

    // Update payment record
    if (result.checkoutRequestId && payments.has(result.checkoutRequestId)) {
      const payment = payments.get(result.checkoutRequestId);
      payment.status = result.success ? 'completed' : 'failed';
      payment.resultDesc = result.resultDesc;
      payment.completedAt = new Date().toISOString();
      payment.mpesaReceiptNumber = result.MpesaReceiptNumber;
      payment.phoneNumber = result.PhoneNumber;
      payment.amount = result.Amount || payment.amount;
      payments.set(result.checkoutRequestId, payment);

      // Successful payment for a subscription → store it in the backend
      if (result.success && payment.subscription) {
        const { userId, tier, userType } = payment.subscription;
        try {
          const activated = await activateSubscription({ userId, tier, userType });
          if (activated.success) {
            console.log(`[Callback] Subscription stored for ${userId}: ${tier} (${userType})`);
          } else {
            console.error('[Callback] Failed to store subscription:', activated.error);
          }
        } catch (err) {
          console.error('[Callback] Subscription activation threw:', err.message);
        }
      }
    }

    // Safaricom expects an empty 200 response to acknowledge receipt
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    console.error('[Callback] Error:', err.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

// ============================================================
// GET /api/mpesa/status/:checkoutRequestId
// Check payment status from our records
// ============================================================
app.get('/api/mpesa/status/:checkoutRequestId', (req, res) => {
  const { checkoutRequestId } = req.params;
  const payment = payments.get(checkoutRequestId);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      checkoutRequestId,
    });
  }

  res.json({
    success: true,
    payment,
  });
});

// ============================================================
// GET /api/mpesa/query/:checkoutRequestId
// Query the actual status from Daraja API
// ============================================================
app.get('/api/mpesa/query/:checkoutRequestId', async (req, res) => {
  try {
    const result = await queryStatus(req.params.checkoutRequestId);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/subscriptions/status/:userId
// Returns the user's currently active subscription (joined with plan).
// The app polls this to refresh entitlement after payment.
// ============================================================
app.get('/api/subscriptions/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const { success, subscription, expired, error } = await getActiveSubscription(userId);
    if (!success) {
      return res.status(500).json({ success: false, error });
    }
    res.json({ success: true, subscription, expired: !!expired });
  } catch (err) {
    console.error('[Subscriptions] Status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.MPESA_ENV || 'sandbox',
  });
});

// ============================================================
// POST /api/paystack/initialize
// Initialize a Paystack transaction for checkout
// ============================================================
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, currency, metadata } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Amount must be at least 1' });
    }

    // Initialize Paystack transaction
    const result = await initializeTransaction({
      email,
      amount,
      currency: currency || 'KES',
      metadata: {
        ...metadata,
        app_name: 'HAMA',
      },
    });

    // Store payment record
    paystackPayments.set(result.reference, {
      reference: result.reference,
      email,
      amount,
      currency: currency || 'KES',
      status: 'pending',
      accessCode: result.accessCode,
      authorizationUrl: result.authorizationUrl,
      createdAt: new Date().toISOString(),
    });

    console.log(`[Paystack] Initialized: ${result.reference} for KSh ${amount} (${email})`);

    res.json({
      success: true,
      reference: result.reference,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      message: 'Paystack checkout initialized',
    });
  } catch (err) {
    console.error('[Paystack] Initialize Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// POST /api/paystack/callback
// Paystack redirect callback (also triggered on completion)
// ============================================================
app.post('/api/paystack/callback', (req, res) => {
  try {
    const { reference, trxref } = req.body;
    const ref = reference || trxref;

    console.log('[Paystack] Callback received for reference:', ref);

    res.json({ success: true, message: 'Callback received' });
  } catch (err) {
    console.error('[Paystack] Callback Error:', err.message);
    res.status(200).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/paystack/verify/:reference
// Verify a Paystack transaction status
// ============================================================
app.get('/api/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Reference is required' });
    }

    const result = await verifyTransaction(reference);

    // Update local record
    if (paystackPayments.has(reference)) {
      const payment = paystackPayments.get(reference);
      payment.status = result.verified ? 'completed' : result.status;
      payment.verified = result.verified;
      payment.paidAt = result.paidAt;
      payment.channel = result.channel;
      payment.customer = result.customer;
      paystackPayments.set(reference, payment);
    }

    res.json({
      success: true,
      verified: result.verified,
      reference: result.reference,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      paidAt: result.paidAt,
      channel: result.channel,
    });
  } catch (err) {
    console.error('[Paystack] Verify Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/paystack/status/:reference
// Check Paystack transaction status from our records
// ============================================================
app.get('/api/paystack/status/:reference', (req, res) => {
  const { reference } = req.params;
  const payment = paystackPayments.get(reference);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      reference,
    });
  }

  res.json({
    success: true,
    payment,
  });
});

// ============================================================
// GET /api/stripe/publishable-key
// Returns the Stripe publishable key to the client
// ============================================================
app.get('/api/stripe/publishable-key', (req, res) => {
  try {
    const key = getPublishableKey();
    res.json({ success: true, publishableKey: key });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// POST /api/stripe/create-payment-intent
// Create a PaymentIntent for checkout
// ============================================================
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, description, metadata } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Amount must be at least 1' });
    }

    const result = await createPaymentIntent({
      amount,
      currency: currency || 'KES',
      description: description || 'HAMA Subscription',
      metadata: {
        ...metadata,
        app_name: 'HAMA',
      },
    });

    console.log(`[Stripe] Created PaymentIntent: ${result.paymentIntentId} for ${currency || 'KES'} ${amount}`);

    res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
    });
  } catch (err) {
    console.error('[Stripe] Create PaymentIntent Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/stripe/payment-intent/:id
// Retrieve a PaymentIntent status
// ============================================================
app.get('/api/stripe/payment-intent/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'PaymentIntent ID is required' });
    }

    const result = await retrievePaymentIntent(id);

    res.json({
      success: true,
      paymentIntent: result,
    });
  } catch (err) {
    console.error('[Stripe] Retrieve Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`🐝 HAMA Payment Server running on port ${PORT}`);
  console.log(`   M-Pesa: ${process.env.MPESA_ENV || 'sandbox'}`);
  console.log(`   MPESA Callback: ${process.env.MPESA_CALLBACK_URL || 'Not set'}`);
  console.log(`   Paystack: ${process.env.PAYSTACK_SECRET_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
});
