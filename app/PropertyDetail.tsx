import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { PropertyDetailScreen } from '../src/screens/PropertyDetailScreen';

export default function PropertyDetail() {
  const { propertyId } = useLocalSearchParams();

  return (
    <PropertyDetailScreen
      route={{ params: { propertyId: propertyId as string } }}
      navigation={{
        goBack: () => router.back(),
        navigate: (route: string, params?: any) => {
          if (route === 'Inbox') router.push('/Inbox');
          else if (route === 'Chat') router.push({ pathname: '/Chat', params });
        },
      }}
    />
  );
}
