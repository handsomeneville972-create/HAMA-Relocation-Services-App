/**
 * HAMA™ Explore Neighborhoods Screen
 *
 * Full-page grid of neighborhood thumbnails, each with a text title
 * below the image (no gradient overlay). Thumbnails are 2× larger
 * than the home page cards.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNeighborhoods } from '../services/propertyService';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useResponsive } from '../utils/responsive';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { Neighborhood } from '../constants/types';

interface ExploreNeighborhoodsScreenProps {
  navigation?: any;
}

export const ExploreNeighborhoodsScreen: React.FC<ExploreNeighborhoodsScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width, padding } = useResponsive();

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      const { data } = await getNeighborhoods();
      if (data) setNeighborhoods(data);
      setLoading(false);
    };
    fetchNeighborhoods();
  }, []);

  const cardGap = SPACING.md;
  const cardWidth = (width - padding * 2 - cardGap) / 2;
  const cardHeight = cardWidth * 1.45;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradientNight}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Neighborhoods</Text>
        <Text style={styles.headerSubtitle}>
          Discover the best areas to call home
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={[styles.grid, { gap: cardGap }]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.gridItem, { width: cardWidth }]}>
                <SkeletonLoader type="banner" width={cardWidth} />
                <View style={styles.skeletonText} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.grid, { gap: cardGap }]}>
            {neighborhoods.map((hood) => (
              <TouchableOpacity
                key={hood.id}
                activeOpacity={0.9}
                style={[styles.gridItem, { width: cardWidth }]}
              >
                <Image
                  source={{ uri: hood.image }}
                  style={[
                    styles.neighborhoodImage,
                    { height: cardHeight, borderRadius: RADIUS.lg },
                  ]}
                />
                <Text style={styles.neighborhoodName}>{hood.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    header: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    headerTitle: {
      ...FONTS.h1,
      color: COLORS.text,
    },
    headerSubtitle: {
      color: COLORS.textSecondary,
      fontSize: 14,
      marginTop: 6,
    },
    scrollContent: {
      padding: SPACING.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    gridItem: {
      marginBottom: SPACING.md,
    },
    neighborhoodImage: {
      width: '100%',
    },
    neighborhoodName: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 8,
    },
    skeletonText: {
      height: 14,
      width: '60%',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 4,
      marginTop: 8,
    },
  });
