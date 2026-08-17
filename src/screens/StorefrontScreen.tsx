import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductCard } from '../components/ProductCard';
import { ResponsiveGrid } from '../components/ResponsiveGrid';
import { getSellerById, getProducts } from '../services/productService';
import { useResponsive } from '../utils/responsive';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { Seller, Product } from '../constants/types';
import { SkeletonLoader } from '../components/SkeletonLoader';

const BANNER_HEIGHT = 200;

export const StorefrontScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sellerId } = route.params;
  const { isPhone, isTablet } = useResponsive();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [sellRes, prodRes] = await Promise.all([
        getSellerById(sellerId),
        getProducts({ sellerId }),
      ]);
      if (sellRes.data) setSeller(sellRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  if (!seller) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonLoader type="detail-hero" />
          <View style={{ padding: SPACING.md, gap: SPACING.md }}>
            <SkeletonLoader type="storefront-card" count={3} />
            <SkeletonLoader type="detail-section" count={2} />
            <SkeletonLoader type="card" count={2} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const bannerTranslateY = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT],
    outputRange: [0, -BANNER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const bannerScale = scrollY.interpolate({
    inputRange: [-50, 0, BANNER_HEIGHT],
    outputRange: [1.1, 1, 1],
    extrapolate: 'clamp',
  });

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
        {/* Banner with Parallax */}
        <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: bannerTranslateY }, { scale: bannerScale }] }]}>
          <Image source={{ uri: seller.banner }} style={styles.bannerImage} />
          <LinearGradient colors={['transparent', colors.bg]} style={styles.bannerGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Store Info */}
        <View style={styles.storeInfo}>
          <Image source={{ uri: seller.logo }} style={styles.storeLogo} />
          <View style={styles.storeText}>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName}>{seller.name}</Text>
              {seller.verified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            <Text style={styles.storeLocation}>{seller.location}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="star" size={16} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{seller.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={16} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{seller.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="cube" size={16} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{seller.description}</Text>
        </View>

        {/* Contact */}
        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{seller.contact}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{seller.location}</Text>
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products ({seller.products.length})</Text>
          <ResponsiveGrid columns={isPhone ? 2 : isTablet ? 3 : 4}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              />
            ))}
          </ResponsiveGrid>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Follow Button */}
      <View style={styles.followBar}>
        <LinearGradient colors={[colors.bgBlur, colors.bg]} style={styles.followGradient}>
          <TouchableOpacity style={styles.followButton}>
            <Ionicons name="person-add-outline" size={20} color={colors.text} />
            <Text style={styles.followText}>Follow Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactFloatingButton}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bannerContainer: {
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
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
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: -30,
    gap: 16,
    zIndex: 1,
  },
  storeLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  storeText: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    ...FONTS.h2,
    color: colors.text,
  },
  storeLocation: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.glassBorder,
  },
  descriptionSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  contactSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  productsSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  followBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  followGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 12,
    paddingBottom: 30,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  followText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  contactFloatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
