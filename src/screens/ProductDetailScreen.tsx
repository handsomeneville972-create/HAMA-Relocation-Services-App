import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { getProductById } from '../services/productService';
import { findOrCreateConversation } from '../services/conversationService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../utils/responsive';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { formatPrice } from '../utils/currency';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Product } from '../constants/types';

export const ProductDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { isDesktop } = useResponsive();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, inCart, cartQuantity, trackView } = useCart();
  const { currentUserId } = useAuth();

  useEffect(() => {
    getProductById(productId).then(({ data }) => {
      if (data) setProduct(data);
      setLoading(false);
    });
    trackView(productId);
  }, [productId, trackView]);

  if (!product) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonLoader type="detail-hero" />
          <View style={styles.content}>
            <SkeletonLoader type="detail-section" count={3} />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const hero = (
    <Animated.View style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop, { opacity: imageOpacity }]}>
      <Image source={{ uri: product.images?.[0] ?? 'https://placehold.co/800x600/1a1a1a/666?text=No+Image' }} style={styles.heroImage} />
      <LinearGradient colors={['transparent', COLORS.bg]} style={styles.imageGradient} />
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      {/* Image gallery dots */}
      <View style={styles.galleryDots}>
        {(product.images ?? []).map((_, i) => (
          <View key={i} style={[styles.dot, i === 0 && styles.activeDot]} />
        ))}
      </View>
    </Animated.View>
  );

  const summary = (
    <View style={styles.summaryCards}>
      {/* Product Info */}
      <View style={styles.titleSection}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          )}
          {product.originalPrice && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Seller Info */}
      <TouchableOpacity style={styles.sellerSection}>
        <Image source={{ uri: product.seller?.logo ?? 'https://i.pravatar.cc/100?u=seller' }} style={styles.sellerLogo} />
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{product.seller.name}</Text>
          <View style={styles.sellerRating}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.sellerRatingText}>{product.seller.rating}</Text>
            <Text style={styles.sellerReviewCount}>({product.seller.reviewCount} reviews)</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {/* Description */}
      <GlassCard>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{product.description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaLabel}>Condition: </Text>
            <Text style={styles.metaValue}>{product.condition}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaLabel}>Location: </Text>
            <Text style={styles.metaValue}>{product.location}</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {isDesktop ? (
          <View style={styles.desktopRow}>
            <View style={styles.desktopGallery}>{hero}</View>
            <View style={styles.desktopSummary}>{summary}</View>
          </View>
        ) : (
          <>
            {hero}
            <View style={styles.content}>{summary}</View>
          </>
        )}

        <View style={[styles.content, isDesktop && styles.contentNoOverlap]}>
          {/* Reviews */}
          <GlassCard>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Text style={styles.reviewCount}>{product.reviewCount} reviews</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.ratingValue}>{product.rating}</Text>
              <Text style={styles.ratingMax}>/ 5.0</Text>
            </View>
          </GlassCard>

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <LinearGradient colors={[COLORS.bgBlur, COLORS.bg]} style={styles.ctaGradient}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={async () => {
              if (!product?.seller?.id) {
                Alert.alert('Error', 'Seller information not available.');
                return;
              }
              if (!currentUserId) {
                Alert.alert('Error', 'Please log in to contact the seller.');
                return;
              }
              const { data, error } = await findOrCreateConversation(currentUserId, product.seller.id, { productId: product.id });
              if (data) {
                navigation.navigate('Chat', { conversationId: data.conversationId });
              } else {
                Alert.alert('Error', 'Could not start conversation. Please try again.');
              }
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => {
              addItem(product.id, 1);
              navigation.navigate('Cart');
            }}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buyGradient}>
              <Text style={styles.buyText}>{inCart(product.id) ? `In Cart · ${cartQuantity(product.id)}` : 'Add to Cart'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  imageContainer: {
    height: 350,
    position: 'relative',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  imageContainerDesktop: {
    height: 460,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  desktopRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    padding: SPACING.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  desktopGallery: {
    flex: 1.2,
  },
  desktopSummary: {
    flex: 1,
  },
  summaryCards: {
    gap: SPACING.md,
  },
  contentNoOverlap: {
    marginTop: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryDots: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: SPACING.md,
    marginTop: -SPACING.xl,
    gap: SPACING.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  titleSection: {
    marginBottom: SPACING.sm,
  },
  productName: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    ...FONTS.price,
    color: COLORS.primary,
  },
  originalPrice: {
    color: COLORS.textTertiary,
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 12,
  },
  sellerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerRatingText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  sellerReviewCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  metaRow: {
    gap: 8,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCount: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  ratingMax: {
    color: COLORS.textTertiary,
    fontSize: 16,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ctaGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 12,
    paddingBottom: 30,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  contactButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  buyButton: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  buyGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
