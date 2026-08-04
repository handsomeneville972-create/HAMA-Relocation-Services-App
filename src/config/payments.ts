/**
 * Payment Methods Configuration
 *
 * Payment methods are shown in checkout only when their backend keys are
 * configured. M-Pesa is always available (server-side Daraja keys live on
 * the payment server, not the client).
 *
 * Add keys via .env:
 *   EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...   (enables Paystack)
 *   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (enables Stripe)
 */

export type EnabledPaymentMethod = 'mpesa' | 'paystack' | 'stripe';

function env(key: string): string | undefined {
  return process.env[key];
}

/** Payment methods that have their required keys configured. */
export function getEnabledPaymentMethods(): EnabledPaymentMethod[] {
  const methods: EnabledPaymentMethod[] = ['mpesa'];
  if (env('EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY')) methods.push('paystack');
  if (env('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY')) methods.push('stripe');
  return methods;
}

export function isPaymentMethodEnabled(method: EnabledPaymentMethod): boolean {
  return getEnabledPaymentMethods().includes(method);
}
