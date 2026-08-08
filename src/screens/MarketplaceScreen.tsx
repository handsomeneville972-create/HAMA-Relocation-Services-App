import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../components/ProductCard';
import { CategoryGrid } from '../components/CategoryGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useCart } from '../contexts/CartContext';
import { PRODUCT_CATEGORIES } from '../constants/data';
import { getProducts, getSellers } from '../services/productService';
import { softSanitize } from '../utils/sanitize';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { Product, Seller } from '../constants/types';

const PAGE_SIZE = 20;

export const MarketplaceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { totalQuantity } = useCart();

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const [prodRes, sellRes] = await Promise.all([
      getProducts({ pagination: { page: pageNum, pageSize: PAGE_SIZE } }),
      pageNum === 1 ? getSellers() : Promise.resolve({ data: null, error: null }),
    ]);
    const newProducts = prodRes.data;
    if (newProducts) {
      setProducts(prev => (append ? [...prev, ...newProducts] : newProducts));
      setHasMore(newProducts.length === PAGE_SIZE);
    }
    if (sellRes.data) setSellers(sellRes.data);
  }, []);

  useEffect(() => {
    fetchPage(1, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true).finally(() => setLoadingMore(false));
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const filteredBySearch = searchQuery
    ? filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredProducts;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <Text style={styles.headerSubtitle}>Find everything for your home</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={22} color={COLORS.text} />
            {totalQuantity > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalQuantity > 99 ? '99+' : totalQuantity}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(softSanitize(text))}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.section}>
          <CategoryGrid
            categories={PRODUCT_CATEGORIES}
            selected={selectedCategory}
            onSelect={(name) => setSelectedCategory(selectedCategory === name ? '' : name)}
          />
        </View>

        {/* Sellers Banner */}
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellersScroll}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ width: 160 }}>
                <SkeletonLoader type="storefront-card" />
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellersScroll}>
            {sellers.map((seller) => (
              <TouchableOpacity
                key={seller.id}
                style={styles.sellerCard}
                onPress={() => navigation.navigate('Storefront', { sellerId: seller.id })}
              >
                <LinearGradient colors={COLORS.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sellerGradient}>
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName} numberOfLines={1}>{seller.name}</Text>
                    <View style={styles.sellerRating}>
                      <Ionicons name="star" size={12} color={COLORS.warning} />
                      <Text style={styles.sellerRatingText}>{seller.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.sellerProducts}>{seller.products?.length ?? 0} products</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory || 'All Products'}
            </Text>
            <Text style={styles.productCount}>{loading ? '...' : filteredBySearch.length + ' items'}</Text>
          </View>
          {loading ? (
            <View style={styles.productsGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={{ width: '48%' }}>
                  <SkeletonLoader type="card" />
                </View>
              ))}
            </View>
          ) : (
            <>
              <View style={styles.productsGrid}>
                {filteredBySearch.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  />
                ))}
              </View>
              {filteredBySearch.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              )}
              {!loading && filteredBySearch.length > 0 && hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerContent: {},
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
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
  productCount: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  sellersScroll: {
    paddingHorizontal: SPACING.md,
    gap: 10,
    marginBottom: SPACING.md,
  },
  sellerCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    width: 160,
  },
  sellerGradient: {
    padding: SPACING.sm,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sellerRatingText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  sellerProducts: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 16,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
