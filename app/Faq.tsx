import React from 'react';
import { router } from 'expo-router';
import { FaqScreen } from '../src/screens/FaqScreen';

export default function Faq() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string) => router.navigate(route as never),
  };

  return <FaqScreen navigation={navigation} />;
}
