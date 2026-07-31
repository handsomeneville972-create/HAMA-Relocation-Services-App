import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, Image, Linking, TextInput } from 'react-native';
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
                <View key={i} style={{ width: 300 }}>
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

        {/* Professional Footer */}
        <View style={styles.footerContainer}>
          {/* Background Image */}
          <Image source={require('../../assets/footer-bg.png')} style={styles.footerBg} resizeMode="cover" />
          {/* Dark overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.92)']}
            style={styles.footerOverlay}
          />

          {/* Footer Content */}
          <View style={styles.footerContent}>
            {/* Main columns row */}
            <View style={styles.footerColumns}>
              {/* Logo + Description + Socials */}
              <View style={styles.footerBrand}>
                <Image source={require('../../assets/hama-logo.png')} style={styles.footerLogo} resizeMode="contain" />
                <Text style={styles.footerBrandName}>HAMA™</Text>
                <Text style={styles.footerDescription}>
                  Your all-in-one platform for finding rental homes, easy relocation, and home essentials—making every move simple.
                </Text>
                <View style={styles.footerSocials}>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.facebook.com/hamanasi2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-facebook" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.instagram.com/hamanasi2026/')} activeOpacity={0.7}>
                    <Ionicons name="logo-instagram" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://x.com/hamanasi2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-twitter" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.tiktok.com/@hama_nasi_2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-tiktok" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.youtube.com/channel/UCR6Px4BchUW3z143ntOLx7w')} activeOpacity={0.7}>
                    <Ionicons name="logo-youtube" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://linkedin.com/company/hama')} activeOpacity={0.7}>
                    <Ionicons name="logo-linkedin" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Explore Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Explore</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>Rentals</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}><Text style={styles.footerLink}>Relocation</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}><Text style={styles.footerLink}>Marketplace</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}><Text style={styles.footerLink}>Services</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>Short Lets</Text></TouchableOpacity>
              </View>

              {/* Company Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Company</Text>
                <TouchableOpacity onPress={() => navigation.navigate('About')}><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/careers')}><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/blog')}><Text style={styles.footerLink}>Blog</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/press')}><Text style={styles.footerLink}>Press</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('mailto:support@hama.com')}><Text style={styles.footerLink}>Contact Us</Text></TouchableOpacity>
              </View>

              {/* Support Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Support</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/faqs')}><Text style={styles.footerLink}>FAQs</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/safety')}><Text style={styles.footerLink}>Safety Tips</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/terms')}><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              </View>

              {/* Stay Updated */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Stay Updated</Text>
                <Text style={styles.footerStayText}>Subscribe to get the latest homes, deals and tips.</Text>
                <View style={styles.footerEmailRow}>
                  <TextInput
                    style={styles.footerEmailInput}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.footerEmailBtn}>
                    <Ionicons name="send" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Bar */}
            <View style={styles.footerBottomBar}>
              <Text style={styles.footerCopyright}>© 2026 HAMA. All rights reserved.</Text>
              <Text style={styles.footerTaglineBottom}>
                ❤ <Text style={styles.footerTaglineBold}>Built for you.</Text>{' '}
                <Text style={styles.footerTaglineBold}>Built for today.</Text>{' '}
                <Text style={styles.footerTaglineBold}>Built for home.</Text>
              </Text>
            </View>
          </View>
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
    gap: 8,
    paddingRight: SPACING.md,
  },
  propertyCard: {
    width: 300,
  },
  propertyImage: {
    width: '100%',
    height: 175,
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
    gap: 8,
    paddingRight: SPACING.md,
  },
  neighborhoodCard: {
    width: 220,
    height: 160,
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

  // Professional Footer
  footerContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  footerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  footerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerContent: {
    position: 'relative',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.lg,
  },
  footerColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  footerBrand: {
    width: 200,
    gap: 6,
  },
  footerLogo: {
    width: 40,
    height: 40,
  },
  footerBrandName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  footerSocials: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  footerSocialBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerColumn: {
    gap: 8,
    minWidth: 100,
  },
  footerColumnTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 22,
  },
  footerStayText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  footerEmailRow: {
    flexDirection: 'row',
    gap: 0,
    marginTop: 4,
  },
  footerEmailInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  footerEmailBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  footerBottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerCopyright: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  footerTaglineBottom: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerTaglineBold: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
