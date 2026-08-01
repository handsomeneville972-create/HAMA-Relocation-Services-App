import React from 'react';
import { useRouter } from 'expo-router';
import { SellerDashboardScreen } from '../src/screens/SellerDashboardScreen';

export default function SellerDashboardRoute() {
  const router = useRouter();
  return (
    <SellerDashboardScreen
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
