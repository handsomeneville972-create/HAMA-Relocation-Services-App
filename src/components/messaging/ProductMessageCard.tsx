/**
 * ProductMessageCard
 *
 * Rich card for sharing a marketplace product inside a conversation.
 * Loads product data by ID and shows image, name, price, seller, and a CTA to view.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { getProductById } from '../../services/productService';

interface ProductMessageCardProps {
  productId: string;
  onPress?: () => void;
}

export const ProductMessageCard: React.FC<ProductMessageCardProps> = ({
  productId,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductById(productId).then(({ data }) => {
      setProduct(data);
      setLoading(false);
    });
  }, [productId]);

  if (loading || !product) {
    return (
      <View style={styles.card}>
        <View style={styles.imageSkeleton} />
        <View style={styles.content}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '50%' }]} />
        </View>
      </View>
    );
  }

  const formatPrice = (p: number) => `KSh ${p.toLocaleString()}`;
  const imageUrl = product.images?.[0] || product.imageUrl;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{product.name || product.title}</Text>
        {product.seller?.name && (
          <Text style={styles.seller} numberOfLines={1}>by {product.seller.name}</Text>
        )}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.condition && <Text style={styles.condition}>{product.condition}</Text>}
        </View>
        <View style={styles.ctaRow}>
          <Ionicons name="open-outline" size={12} color={colors.primary} />
          <Text style={styles.cta}>View Product</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    width: 200,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: colors.bgElevated,
  },
  imageSkeleton: {
    width: '100%',
    height: 110,
    backgroundColor: colors.bgElevated,
  },
  content: {
    padding: SPACING.sm,
    gap: 3,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
    width: '80%',
  },
  name: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  seller: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    ...FONTS.price,
    color: colors.primary,
    fontSize: 14,
  },
  condition: {
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
