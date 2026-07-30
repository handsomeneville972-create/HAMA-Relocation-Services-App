import React from 'react';
import { useRouter } from 'expo-router';
import { LandlordOnboardingScreen } from '../src/screens/LandlordOnboardingScreen';

export default function LandlordOnboardingRoute() {
  const router = useRouter();
  return (
    <LandlordOnboardingScreen
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
