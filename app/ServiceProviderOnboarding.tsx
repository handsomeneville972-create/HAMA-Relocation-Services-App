import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ServiceProviderOnboardingScreen } from '../src/screens/ServiceProviderOnboardingScreen';
import { ProviderPlanTier } from '../src/constants/types';
import { normalizeProviderPlan } from '../src/services/providerOnboardingService';

export default function ServiceProviderOnboardingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();
  const plan = normalizeProviderPlan(params.plan || 'Basic');
  return (
    <ServiceProviderOnboardingScreen
      plan={plan as ProviderPlanTier}
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
