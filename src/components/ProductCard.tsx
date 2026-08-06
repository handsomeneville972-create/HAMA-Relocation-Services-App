import React, { useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../constants/types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatPrice } from '../utils/currency';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, ANIMATION, EASING } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, featured = false }) => {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION.normal,
        delay: Math.random() * 200,
        easing: EASING.easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        delay: Math.random() * 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion, fadeAnim, scaleAnim]);

  const handlePressIn = () => {
    Animated.spring(liftAnim, {
      toValue: -8,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(liftAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        featured && styles.featuredContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: liftAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.images?.[0] ?? 'https://placehold.co/400x400/1a1a1a/666?text=No+Image' }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          <View style={styles.badgeRow}>
            {featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
            {product.originalPrice && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.heartButton}>
            <Ionicons name="heart-outline" size={18} color="#fff" />
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.rating}>{product.rating}</Text>
            </View>
            <Text style={styles.location}>{product.location}</Text>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  featuredContainer: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  touchable: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1,
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: SPACING.sm,
  },
  name: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  originalPrice: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  featuredBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  featuredText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
