import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MarketplaceScreen } from '../../src/screens/MarketplaceScreen';
import { PaywallOverlay } from '../../src/components/PaywallOverlay';
import { useSubscriptions } from '../../src/contexts/SubscriptionContext';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';

export default function MarketplaceTab() {
  const { isSeekerLocked } = useSubscriptions();
  const [paywallVisible, setPaywallVisible] = useState(isSeekerLocked);
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
      else if (route === 'Storefront') router.push({ pathname: '/Storefront', params });
      else if (route === 'Cart') router.push('/Cart');
    },
  };

  return (
    <View style={styles.container}>
      <MarketplaceScreen navigation={navigation as any} />

      {/* Blur overlay for non-subscribers */}
      {isSeekerLocked && (
        <View style={styles.blurOverlay}>
          <View style={styles.blurCard}>
            <Text style={styles.blurMessage}>
              YOU CURRENTLY HAVE NO ACCESS TO THIS FEATURE AND MANY OTHERS. PAY KSH 170 TO UNLOCK ALL FEATURES!
            </Text>
          </View>
        </View>
      )}

      <PaywallOverlay
        visible={paywallVisible && isSeekerLocked}
        onDismiss={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  blurCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  blurMessage: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
