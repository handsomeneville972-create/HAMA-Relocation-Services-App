import React from 'react';
import { router } from 'expo-router';
import { MyPostsScreen } from '../src/screens/MyPostsScreen';
import { useAuth } from '../src/contexts/AuthContext';

export default function MyPostsPage() {
  const { currentUserId } = useAuth();

  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'PostDetail') router.push({ pathname: '/PostDetail', params });
    },
  };

  return <MyPostsScreen navigation={navigation} userId={currentUserId} />;
}
