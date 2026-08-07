import React from 'react';
import { useRouter } from 'expo-router';
import { BecomeProviderScreen } from '../src/screens/BecomeProviderScreen';

export default function BecomeProviderRoute() {
  const router = useRouter();
  return (
    <BecomeProviderScreen
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string) => router.push(`/${route}`),
      }}
    />
  );
}
