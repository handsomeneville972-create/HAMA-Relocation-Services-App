/**
 * StripeWrapper
 *
 * Fetches the Stripe publishable key from the HAMA backend and
 * renders a StripeProvider. This ensures the provider always has
 * a valid key before any child component calls useStripe().
 *
 * Usage: Wrap a screen that uses useStripePayment hook.
 *
 *   <StripeWrapper>
 *     <SubscriptionsContent />
 *   </StripeWrapper>
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { getStripePublishableKey } from '../services/stripeService';
import { SPACING, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface StripeWrapperProps {
  children: React.ReactNode;
}

export const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchKey = async () => {
      const res = await getStripePublishableKey();
      if (!mounted) return;

      if (res.success && res.publishableKey) {
        setPublishableKey(res.publishableKey);
      } else {
        setError(res.error || 'Failed to initialize Stripe');
      }
    };

    fetchKey();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!publishableKey) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as React.ReactElement}
    </StripeProvider>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: SPACING.sm,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
