import React from 'react';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { router } from 'expo-router';

export default function HomeTab() {
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'Notifications') router.push('/(tabs)/notifications');
      else if (route === 'Marketplace') router.push('/(tabs)/marketplace');
      else if (route === 'Services') router.push('/(tabs)/services');
      else if (route === 'Community') router.push('/(tabs)/community');
      else if (route === 'Subscriptions') router.push('/Subscriptions');
      else if (route === 'Search') router.push('/Search');
      else if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
      else if (route === 'Storefront') router.push({ pathname: '/Storefront', params });
      else if (route === 'ServiceDetail') router.push({ pathname: '/ServiceDetail', params });
      else if (route === 'PropertyDetail') router.push({ pathname: '/PropertyDetail', params });
      else if (route === 'FeaturedProperties') router.push('/FeaturedProperties');
    },
  };

  return <HomeScreen navigation={navigation as any} />;
}
