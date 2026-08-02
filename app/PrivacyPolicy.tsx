import React from 'react';
import { router } from 'expo-router';
import { PrivacyPolicyScreen } from '../src/screens/PrivacyPolicyScreen';

export default function PrivacyPolicy() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <PrivacyPolicyScreen navigation={navigation} />;
}
