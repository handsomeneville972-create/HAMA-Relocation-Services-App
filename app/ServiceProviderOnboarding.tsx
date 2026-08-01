import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ServiceProviderOnboardingScreen } from '../src/screens/ServiceProviderOnboardingScreen';
import { ProviderPlanTier } from '../src/constants/types';

export default function ServiceProviderOnboardingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();
  const plan = (params.plan === 'Premium' ? 'Premium' : 'Standard') as ProviderPlanTier;
  return (
    <ServiceProviderOnboardingScreen
      plan={plan}
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
