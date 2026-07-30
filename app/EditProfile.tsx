import React from 'react';
import { router } from 'expo-router';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';

export default function EditProfile() {
  return <EditProfileScreen navigation={{ goBack: () => router.back() }} />;
}
