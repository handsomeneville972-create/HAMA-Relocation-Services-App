import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LandlordDashboardScreen } from '../src/screens/LandlordDashboardScreen';

export default function LandlordDashboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ firstRun?: string }>();
  return (
    <LandlordDashboardScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (route: string) => router.push(`/${route}`),
      }}
      firstRun={params.firstRun === '1'}
    />
  );
}