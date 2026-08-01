import React from 'react';
import { CommunityScreen } from '../../src/screens/CommunityScreen';
import { router } from 'expo-router';

export default function CommunityTab() {
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'PostDetail') router.push({ pathname: '/PostDetail', params });
      else if (route === 'CreatePost') router.push('/CreatePost');
    },
  };

  return <CommunityScreen navigation={navigation as any} />;
}
