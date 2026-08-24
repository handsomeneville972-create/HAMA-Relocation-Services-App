import React from 'react';
import { router } from 'expo-router';
import { ExploreNeighborhoodsScreen } from '../src/screens/ExploreNeighborhoodsScreen';

export default function ExploreNeighborhoods() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <ExploreNeighborhoodsScreen navigation={navigation} />;
}
