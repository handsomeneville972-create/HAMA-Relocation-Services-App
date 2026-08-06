import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ServiceProviderProfileScreen } from '../src/screens/ServiceProviderProfileScreen';

export default function ServiceProviderProfileRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string }>();
  return (
    <ServiceProviderProfileScreen
      providerId={params.providerId}
      navigation={{
        goBack: () => router.back(),
        replace: (route: string) => router.replace(`/${route}`),
        navigate: (route: string, routeParams?: any) => {
          if (route === 'Chat') {
            router.push({ pathname: '/Chat', params: routeParams });
          } else {
            router.push(`/${route}`);
          }
        },
      }}
    />
  );
}
