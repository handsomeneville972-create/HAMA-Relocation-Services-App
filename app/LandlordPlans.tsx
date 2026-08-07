import React from 'react';
import { useRouter } from 'expo-router';
import { LandlordPlansScreen } from '../src/screens/LandlordPlansScreen';

export default function LandlordPlansRoute() {
  const router = useRouter();
  return (
    <LandlordPlansScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
