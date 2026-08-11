/**
 * PropertyMessageCard
 *
 * Rich card for sharing a property inside a conversation.
 * Shows property image, title, location, price, and a CTA to view.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';

interface PropertyMessageCardProps {
  title: string;
  location: string;
  price: number;
  imageUrl?: string;
  bedrooms?: number;
  bathrooms?: number;
  onPress?: () => void;
}

export const PropertyMessageCard: React.FC<PropertyMessageCardProps> = ({
  title,
  location,
  price,
  imageUrl,
  bedrooms,
  bathrooms,
  onPress,
}) => {
  const formatPrice = (p: number) => {
    return `KSh ${p.toLocaleString()}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.location} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {(bedrooms != null || bathrooms != null) && (
            <Text style={styles.details}>
              {bedrooms != null ? `${bedrooms} bed` : ''}{bedrooms != null && bathrooms != null ? ' · ' : ''}{bathrooms != null ? `${bathrooms} bath` : ''}
            </Text>
          )}
        </View>
        <View style={styles.ctaRow}>
          <Ionicons name="open-outline" size={12} color={COLORS.primary} />
          <Text style={styles.cta}>View Property</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.bgElevated,
  },
  content: {
    padding: SPACING.sm,
    gap: 4,
  },
  title: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...FONTS.price,
    color: COLORS.primary,
    fontSize: 14,
  },
  details: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cta: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
