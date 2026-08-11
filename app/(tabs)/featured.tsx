import React from 'react';
import { FeaturedPropertiesScreen } from '../../src/screens/FeaturedPropertiesScreen';
import { router } from 'expo-router';

export default function FeaturedTab() {
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'PropertyDetail') router.push({ pathname: '/PropertyDetail', params });
      else if (route === 'Notifications') router.push('/(tabs)/notifications');
    },
  };

  return <FeaturedPropertiesScreen navigation={navigation as any} />;
}
