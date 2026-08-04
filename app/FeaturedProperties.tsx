import React from 'react';
import { router } from 'expo-router';
import { FeaturedPropertiesScreen } from '../src/screens/FeaturedPropertiesScreen';

export default function FeaturedProperties() {
  return (
    <FeaturedPropertiesScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (route: string, params?: any) => {
          if (route === 'PropertyDetail') {
            router.push({ pathname: '/PropertyDetail', params });
          } else if (route === 'Notifications') {
            router.push('/(tabs)/notifications');
          }
        },
      }}
    />
  );
}
