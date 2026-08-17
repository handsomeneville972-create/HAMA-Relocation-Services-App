/**
 * PropertyMessageCard
 *
 * Rich card for sharing a property inside a conversation.
 * Loads property data by ID and shows image, title, location, price, and a CTA to view.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { getPropertyById } from '../../services/propertyService';

interface PropertyMessageCardProps {
  propertyId: string;
  onPress?: () => void;
}

export const PropertyMessageCard: React.FC<PropertyMessageCardProps> = ({
  propertyId,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPropertyById(propertyId).then(({ data }) => {
      setProperty(data);
      setLoading(false);
    });
  }, [propertyId]);

  if (loading || !property) {
    return (
      <View style={styles.card}>
        <View style={styles.imageSkeleton} />
        <View style={styles.content}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
      </View>
    );
  }

  const formatPrice = (p: number) => `KSh ${p.toLocaleString()}`;
  const imageUrl = property.images?.[0] || property.imageUrl;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.location} numberOfLines={1}>{property.location}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          {(property.bedrooms != null || property.bathrooms != null) && (
            <Text style={styles.details}>
              {property.bedrooms != null ? `${property.bedrooms} bed` : ''}
              {property.bedrooms != null && property.bathrooms != null ? ' · ' : ''}
              {property.bathrooms != null ? `${property.bathrooms} bath` : ''}
            </Text>
          )}
        </View>
        <View style={styles.ctaRow}>
          <Ionicons name="open-outline" size={12} color={colors.primary} />
          <Text style={styles.cta}>View Property</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    width: 220,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.bgElevated,
  },
  imageSkeleton: {
    width: '100%',
    height: 120,
    backgroundColor: colors.bgElevated,
  },
  content: {
    padding: SPACING.sm,
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
    width: '80%',
  },
  title: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...FONTS.caption,
    color: colors.textTertiary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...FONTS.price,
    color: colors.primary,
    fontSize: 14,
  },
  details: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cta: {
    ...FONTS.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
