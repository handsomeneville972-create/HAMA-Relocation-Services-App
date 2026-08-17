import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ResponsiveGrid } from '../components/ResponsiveGrid';
import { UserAvatar } from '../components/UserAvatar';
import { useUserFavorites } from '../hooks/useUserData';
import { useResponsive } from '../utils/responsive';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

type TabType = 'properties' | 'products' | 'posts';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'properties', label: 'Properties', icon: 'home-outline' },
  { key: 'products', label: 'Products', icon: 'cart-outline' },
  { key: 'posts', label: 'Posts', icon: 'bookmark-outline' },
];

export const FavoritesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width, isPhone, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const tabWidth = (width - 32) / 3;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const { properties: savedProperties, products: savedProducts, posts: savedPosts } = useUserFavorites();

  const handleTabChange = (tab: TabType, index: number) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: index,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => handleTabChange(tab.key, index)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{
                  translateX: tabIndicator.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, tabWidth, tabWidth * 2],
                  })
                }],
              },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm }}>
            <SkeletonLoader type="card" count={3} />
          </View>
        ) : <>
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <>
            {savedProperties.length === 0 ? (
              <EmptyState icon="home-outline" title="No saved properties" subtitle="Tap the heart icon on any property to save it" />
            ) : (
              savedProperties.map(property => (
                <TouchableOpacity key={property.id} activeOpacity={0.9} style={styles.savedItem} onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}>
                  <GlassCard>
                    <View style={styles.savedItemRow}>
                      <Image source={{ uri: property.images?.[0] ?? 'https://placehold.co/400x300/1a1a1a/666?text=No+Image' }} style={styles.savedImage} />
                      <View style={styles.savedInfo}>
                        <Text style={styles.savedTitle} numberOfLines={2}>{property.title}</Text>
                        <Text style={styles.savedPrice}>KSh {property.price.toLocaleString()}/mo</Text>
                        <View style={styles.savedMeta}>
                          <Text style={styles.savedMetaText}>{property.bedrooms} Bed • {property.bathrooms} Bath</Text>
                          <Text style={styles.savedLocation}>{property.location}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.removeButton}>
                        <Ionicons name="heart" size={20} color={colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {savedProducts.length === 0 ? (
              <EmptyState icon="cart-outline" title="No saved products" subtitle="Tap the heart icon on any product to save it" />
            ) : (
              <ResponsiveGrid columns={isPhone ? 2 : isTablet ? 3 : 4}>
                {savedProducts.map(product => (
                  <TouchableOpacity key={product.id} activeOpacity={0.9} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
                    <GlassCard noPadding>
                      <Image source={{ uri: product.images?.[0] ?? 'https://placehold.co/400x400/1a1a1a/666?text=No+Image' }} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <Text style={styles.productPrice}>KSh {product.price.toLocaleString()}</Text>
                        <View style={styles.productRating}>
                          <Ionicons name="star" size={12} color={colors.warning} />
                          <Text style={styles.productRatingText}>{product.rating}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.productHeart}>
                        <Ionicons name="heart" size={18} color={colors.secondary} />
                      </TouchableOpacity>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </ResponsiveGrid>
            )}
          </>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {savedPosts.length === 0 ? (
              <EmptyState icon="bookmark-outline" title="No saved posts" subtitle="Tap the bookmark icon on any post to save it" />
            ) : (
              savedPosts.map(post => (
                <TouchableOpacity key={post.id} activeOpacity={0.9} style={styles.savedItem} onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
                  <GlassCard>
                    <View style={styles.postItem}>
                      <View style={styles.postHeader}>
                        <UserAvatar uri={post.user.avatar} size={40} style={styles.postAvatar} />
                        <View style={styles.postUserInfo}>
                          <Text style={styles.postUsername}>{post.user.name}</Text>
                          <Text style={styles.postTime}>{post.createdAt}</Text>
                        </View>
                        <TouchableOpacity>
                          <Ionicons name="bookmark" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
                      {post.image && (
                        <Image source={{ uri: post.image }} style={styles.postImage} />
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        </>}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const EmptyState: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon as any} size={48} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  indicatorContainer: {
    height: 2,
    backgroundColor: colors.glassBorder,
  },
  indicator: {
    width: '33.33%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: SPACING.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  savedItem: {
    marginBottom: SPACING.sm,
  },
  savedItemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  savedImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
  },
  savedInfo: {
    flex: 1,
  },
  savedTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedPrice: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  savedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedMetaText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  savedLocation: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    width: '100%',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1.4,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productRatingText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  productHeart: {
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
  postItem: {},
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  postUserInfo: {
    flex: 1,
  },
  postUsername: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  postTime: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  postContent: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
