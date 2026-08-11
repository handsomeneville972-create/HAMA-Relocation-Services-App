import React from 'react';
import { router } from 'expo-router';
import { AboutScreen } from '../src/screens/AboutScreen';

export default function AboutPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'Faq') router.push('/Faq');
      else if (route === 'Settings') router.push('/Settings');
      else if (route === 'PrivacyPolicy') router.push('/PrivacyPolicy');
      else if (route === 'Search') router.push('/Search');
      else if (route === 'Services') router.push('/(tabs)/services');
      else if (route === 'Marketplace') router.push('/(tabs)/marketplace');
      else if (route === 'About') router.push('/About');
    },
  };

  return <AboutScreen navigation={navigation} />;
}
