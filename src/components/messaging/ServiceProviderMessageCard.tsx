/**
 * ServiceProviderMessageCard
 *
 * Rich card for sharing a service provider profile inside a conversation.
 * Shows provider image, name, category, rating, and a CTA to view.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';

interface ServiceProviderMessageCardProps {
  name: string;
  category: string;
  rating?: number;
  imageUrl?: string;
  onPress?: () => void;
}

export const ServiceProviderMessageCard: React.FC<ServiceProviderMessageCardProps> = ({
  name,
  category,
  rating,
  imageUrl,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="cover" />
        )}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
          {rating != null && rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.ctaRow}>
        <Ionicons name="open-outline" size={12} color={COLORS.primary} />
        <Text style={styles.cta}>View Provider</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  category: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    ...FONTS.caption,
    color: COLORS.warning,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cta: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
