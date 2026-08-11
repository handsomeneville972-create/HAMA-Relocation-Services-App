/**
 * ProductMessageCard
 *
 * Rich card for sharing a marketplace product inside a conversation.
 * Shows product image, name, price, seller, and a CTA to view.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';

interface ProductMessageCardProps {
  name: string;
  price: number;
  imageUrl?: string;
  seller?: string;
  condition?: string;
  onPress?: () => void;
}

export const ProductMessageCard: React.FC<ProductMessageCardProps> = ({
  name,
  price,
  imageUrl,
  seller,
  condition,
  onPress,
}) => {
  const formatPrice = (p: number) => `KSh ${p.toLocaleString()}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {seller && <Text style={styles.seller} numberOfLines={1}>by {seller}</Text>}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {condition && <Text style={styles.condition}>{condition}</Text>}
        </View>
        <View style={styles.ctaRow}>
          <Ionicons name="open-outline" size={12} color={COLORS.primary} />
          <Text style={styles.cta}>View Product</Text>
        </View>
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
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.bgElevated,
  },
  content: {
    padding: SPACING.sm,
    gap: 3,
  },
  name: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  seller: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    ...FONTS.price,
    color: COLORS.primary,
    fontSize: 14,
  },
  condition: {
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
