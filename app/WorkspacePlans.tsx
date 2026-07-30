import React from 'react';
import { router } from 'expo-router';
import { WorkspacePlansScreen } from '../src/screens/WorkspacePlansScreen';

export default function WorkspacePlans() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => router.push(`/${route}` as any),
  };

  return <WorkspacePlansScreen navigation={navigation} />;
}
