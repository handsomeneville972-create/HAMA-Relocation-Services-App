import React from 'react';
import { useRouter } from 'expo-router';
import { LandlordDashboardScreen } from '../src/screens/LandlordDashboardScreen';

export default function LandlordDashboardRoute() {
  const router = useRouter();
  return (
    <LandlordDashboardScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
