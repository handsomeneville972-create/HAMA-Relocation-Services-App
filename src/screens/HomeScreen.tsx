import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../components/ProductCard';
import { GlassCard } from '../components/GlassCard';
import { HomieAssistant } from '../components/HomieAssistant';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getProducts } from '../services/productService';
import { getProperties, getNeighborhoods } from '../services/propertyService';
import { formatPrice } from '../utils/currency';
import type { Product, Property, Neighborhood } from '../constants/types';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, DIMENSIONS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, propRes, hoodRes] = await Promise.all([
        getProducts({ featured: true }),
        getProperties({ limit: 4 }),
        getNeighborhoods(),
      ]);

      if (prodRes.data) setFeaturedProducts(prodRes.data.slice(0, 4));
      if (propRes.data) setProperties(propRes.data.slice(0, 3));
      if (hoodRes.data) setNeighborhoods(hoodRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const recentProperties = properties;

  // Parallax hero
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
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
        style={styles.scrollView}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroContainer, { transform: [{ translateY: heroTranslateY }], opacity: heroOpacity }]}>
          {/* Background Image */}
          <Image source={require('../../assets/header.png')} style={styles.heroImage} resizeMode="cover" />
          {/* Edge fades for blurred-edge effect */}
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.3)', 'transparent']}
            style={styles.heroEdgeTop}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
            style={styles.heroEdgeBottom}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroEdgeLeft}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroEdgeRight}
          />

          {/* Content overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
            style={styles.heroContentOverlay}
          >
            <View style={[styles.heroContent, { paddingTop: insets.top + SPACING.xl }]}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <View style={styles.logoContainer}>
                  <Image source={require('../../assets/hama-logo.png')} style={styles.logoImage} resizeMode="contain" />
                  <View>
                    <View style={styles.logoNameRow}>
                      <Text style={styles.logoName}>HAMA™</Text>
                    </View>
                    <Text style={styles.logoSlogan}>Need a house homie? We've got you!</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.notifButton} onPress={() => navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                  <View style={styles.notifDot} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
                <Text style={styles.searchPlaceholder}>Search homes, products, services...</Text>
              </TouchableOpacity>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Marketplace')}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="cart-outline" size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Marketplace</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Services')}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="construct-outline" size={22} color={COLORS.accent} />
                  </View>
                  <Text style={styles.quickActionText}>Services</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Community')}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="people-outline" size={22} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.quickActionText}>Community</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Subscriptions')}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="star-outline" size={22} color={COLORS.warning} />
                  </View>
                  <Text style={styles.quickActionText}>Premium</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Properties Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="home-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Featured Properties</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertiesScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={{ width: 280 }}>
                  <SkeletonLoader type="card" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertiesScroll}>
              {properties.map((property) => (
                <TouchableOpacity key={property.id} activeOpacity={0.9} style={styles.propertyCard} onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}>
                  <GlassCard>
                    <Image source={{ uri: property.images?.[0] ?? 'https://placehold.co/400x300/1a1a1a/666?text=No+Image' }} style={styles.propertyImage} />
                    <View style={styles.propertyInfo}>
                      <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                      <Text style={styles.propertyPrice}>{formatPrice(property.price)}/mo</Text>
                      <View style={styles.propertyMeta}>
                        <Text style={styles.propertyMetaText}>{property.bedrooms} Bed • {property.bathrooms} Bath</Text>
                        <Text style={styles.propertyLocation}>{property.location}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Marketplace Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cart-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Featured Products</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.productsGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ width: '48%' }}>
                  <SkeletonLoader type="card" />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                />
              ))}
            </View>
          )}
        </View>

        {/* Neighborhoods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="map-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Explore Neighborhoods</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.neighborhoodScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLoader key={i} type="banner" width={200} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.neighborhoodScroll}>
              {neighborhoods.map((hood) => (
                <TouchableOpacity key={hood.id} activeOpacity={0.9} style={styles.neighborhoodCard}>
                  <Image source={{ uri: hood.image }} style={styles.neighborhoodImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.neighborhoodOverlay}>
                    <Text style={styles.neighborhoodName}>{hood.name}</Text>
                    <View style={styles.neighborhoodRatingRow}>
                      <Ionicons name="star" size={12} color="#FFB84D" />
                      <Text style={styles.neighborhoodRating}>{hood.rating} • KSh {hood.avgRent.toLocaleString()}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Footer - Social Links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Follow us</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://www.instagram.com/hamanasi2026/?utm_source=ig_web_button_share_sheet')}
              activeOpacity={0.7}
              accessibilityLabel="Follow us on Instagram"
            >
              <LinearGradient
                colors={['#FF6B00', '#FF8A33', '#FFB366', '#FFB84D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.socialGradient}
              >
                <Ionicons name="logo-instagram" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://www.tiktok.com/@hama_nasi_2026?is_from_webapp=1&sender_device=pc')}
              activeOpacity={0.7}
              accessibilityLabel="Follow us on TikTok"
            >
              <View style={styles.tiktokButton}>
                <Ionicons name="logo-tiktok" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerHandle}>@hamanasi2026 / @hama_nasi_2026</Text>
          <Text style={styles.footerTagline}>Need a house homie? We've got you!</Text>
        </View>

        {/* Bottom padding for Homie */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>

      {/* Floating AI Assistant */}
      <HomieAssistant onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    overflow: 'hidden',
    height: height * 0.55,
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroEdgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  heroEdgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  heroEdgeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 40,
  },
  heroEdgeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 40,
  },
  heroContentOverlay: {
    flex: 1,
  },
  heroContent: {
    paddingHorizontal: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  logoSlogan: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: SPACING.md,
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAll: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
  propertiesScroll: {
    gap: 12,
    paddingRight: SPACING.md,
  },
  propertyCard: {
    width: 280,
  },
  propertyImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  propertyInfo: {
    padding: SPACING.sm,
  },
  propertyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyPrice: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  propertyLocation: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  neighborhoodScroll: {
    gap: 12,
    paddingRight: SPACING.md,
  },
  neighborhoodCard: {
    width: 200,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  neighborhoodImage: {
    width: '100%',
    height: '100%',
  },
  neighborhoodOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  },
  neighborhoodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  neighborhoodRating: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  neighborhoodRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: SPACING.md,
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: SPACING.sm,
  },
  socialButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  socialGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#010101',
    borderRadius: 16,
  },
  footerHandle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerTagline: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
});
