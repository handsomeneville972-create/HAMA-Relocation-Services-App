import React from 'react';
import { router } from 'expo-router';
import { WorkspacePlansScreen } from '../src/screens/WorkspacePlansScreen';

export default function WorkspacePlans() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (params && Object.keys(params).length > 0) {
        const qs = Object.entries(params)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&');
        router.push(`/${route}?${qs}` as any);
      } else {
        router.push(`/${route}` as any);
      }
    },
  };

  return <WorkspacePlansScreen navigation={navigation} />;
}
