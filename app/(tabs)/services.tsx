import React from 'react';
import { ServicesScreen } from '../../src/screens/ServicesScreen';
import { useSubscriptions } from '../../src/contexts/SubscriptionContext';
import { router } from 'expo-router';

export default function ServicesTab() {
  const { isSeekerLocked } = useSubscriptions();
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'ServiceDetail') router.push({ pathname: '/ServiceDetail', params });
    },
  };

  return <ServicesScreen navigation={navigation as any} isSeekerLocked={isSeekerLocked} />;
}
