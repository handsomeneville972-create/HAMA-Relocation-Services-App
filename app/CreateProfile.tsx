import React from 'react';
import { router } from 'expo-router';
import { CreateProfileScreen } from '../src/screens/CreateProfileScreen';

export default function CreateProfilePage() {
  const navigation = {
    goBack: () => router.back(),
    replace: (route: string) => {
      if (route === '(tabs)') router.replace('/(tabs)');
    },
  };

  return <CreateProfileScreen navigation={navigation} />;
}
