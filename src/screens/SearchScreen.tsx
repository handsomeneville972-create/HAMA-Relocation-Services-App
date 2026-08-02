import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { searchProperties } from '../services/propertyService';
import { searchProducts } from '../services/productService';
import { searchServiceProviders } from '../services/serviceProviderService';
import { softSanitize } from '../utils/sanitize';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { Property, Product, ServiceProvider } from '../constants/types';

type SearchTab = 'all' | 'properties' | 'products' | 'services';

const TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'properties', label: 'Properties' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
];

export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceProvider[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query) {
      setFilteredProperties([]);
      setFilteredProducts([]);
      setFilteredServices([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const [propRes, prodRes, servRes] = await Promise.all([
        searchProperties(query),
        searchProducts(query),
        searchServiceProviders(query),
      ]);
      if (propRes.data) setFilteredProperties(propRes.data);
      if (prodRes.data) setFilteredProducts(prodRes.data);
      if (servRes.data) setFilteredServices(servRes.data);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = filteredProperties.length + filteredProducts.length + filteredServices.length;

  const RecentSearches = ['2-bedroom apartment Westlands', 'Modern sofa', 'Plumber Nairobi', 'Student housing Ngara'];

  return (
    <View style={styles.container}>
      {/* Search Bar Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textTertiary} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search properties, products, services..."
              placeholderTextColor={COLORS.textTertiary}
              value={query}
              onChangeText={(text) => setQuery(softSanitize(text))}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Tabs */}
        {query ? (
          <View style={styles.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!query ? (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {RecentSearches.map((search, i) => (
                <TouchableOpacity key={i} style={styles.recentItem} onPress={() => setQuery(search)}>
                  <Ionicons name="time-outline" size={18} color={COLORS.textTertiary} />
                  <Text style={styles.recentText}>{search}</Text>
                  <Ionicons name="arrow-up" size={16} color={COLORS.textTertiary} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Categories</Text>
              <View style={styles.popularGrid}>
                {[
                  { icon: 'bed-outline', label: 'Apartments', color: COLORS.primary },
                  { icon: 'cart-outline', label: 'Furniture', color: COLORS.secondary },
                  { icon: 'construct-outline', label: 'Services', color: COLORS.accent },
                  { icon: 'school-outline', label: 'Student Housing', color: COLORS.warning },
                  { icon: 'location-outline', label: 'Neighborhoods', color: COLORS.info },
                  { icon: 'car-outline', label: 'Moving', color: COLORS.primaryLight },
                ].map((cat, i) => (
                  <TouchableOpacity key={i} style={styles.popularCard} onPress={() => setQuery(cat.label)}>
                    <View style={[styles.popularIcon, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                    </View>
                    <Text style={styles.popularLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {searching ? (
              <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm }}>
                <SkeletonLoader type="list" count={5} />
              </View>
            ) : (
            <>
            {/* Results Summary */}
            <View style={styles.resultSummary}>
              <Text style={styles.resultText}>{totalResults} results for "{query}"</Text>
            </View>

            {/* Properties */}
            {(activeTab === 'all' || activeTab === 'properties') && filteredProperties.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="home-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Properties ({filteredProperties.length})</Text>
                </View>
                {filteredProperties.slice(0, 3).map(property => (
                  <TouchableOpacity key={property.id} activeOpacity={0.9} style={styles.resultItem} onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}>
                    <GlassCard>
                      <View style={styles.resultRow}>
                        <Image source={{ uri: property.images?.[0] ?? 'https://placehold.co/400x300/1a1a1a/666?text=No+Image' }} style={styles.resultImage} />
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultTitle} numberOfLines={1}>{property.title}</Text>
                          <Text style={styles.resultPrice}>KSh {property.price.toLocaleString()}/mo</Text>
                          <Text style={styles.resultMeta}>{property.bedrooms} Bed • {property.bathrooms} Bath • {property.location}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
                {filteredProperties.length > 3 && (
                  <TouchableOpacity style={styles.seeAllBtn} onPress={() => setActiveTab('properties')}>
                    <Text style={styles.seeAllText}>See all {filteredProperties.length} properties</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Products */}
            {(activeTab === 'all' || activeTab === 'products') && filteredProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="cart-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Products ({filteredProducts.length})</Text>
                </View>
                {filteredProducts.slice(0, 3).map(product => (
                  <TouchableOpacity key={product.id} activeOpacity={0.9} style={styles.resultItem} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
                    <GlassCard>
                      <View style={styles.resultRow}>
                        <Image source={{ uri: product.images?.[0] ?? 'https://placehold.co/400x400/1a1a1a/666?text=No+Image' }} style={styles.resultImage} />
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultTitle} numberOfLines={1}>{product.name}</Text>
                          <Text style={styles.resultPrice}>KSh {product.price.toLocaleString()}</Text>
                          <Text style={styles.resultMeta}>{product.category} • {product.condition}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
                {filteredProducts.length > 3 && (
                  <TouchableOpacity style={styles.seeAllBtn} onPress={() => setActiveTab('products')}>
                    <Text style={styles.seeAllText}>See all {filteredProducts.length} products</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Services */}
            {(activeTab === 'all' || activeTab === 'services') && filteredServices.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="construct-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Services ({filteredServices.length})</Text>
                </View>
                {filteredServices.slice(0, 3).map(service => (
                  <TouchableOpacity key={service.id} activeOpacity={0.9} style={styles.resultItem} onPress={() => navigation.navigate('ServiceProviderProfile', { providerId: service.id })}>
                    <GlassCard>
                      <View style={styles.resultRow}>
                        <Image source={{ uri: service.logo }} style={styles.resultImage} />
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultTitle} numberOfLines={1}>{service.name}</Text>
                          <View style={styles.resultRating}>
                            <Ionicons name="star" size={12} color={COLORS.warning} />
                            <Text style={styles.resultRatingText}>{service.rating}</Text>
                          </View>
                          <Text style={styles.resultMeta}>{service.subcategory} • {service.location}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
                {filteredServices.length > 3 && (
                  <TouchableOpacity style={styles.seeAllBtn} onPress={() => setActiveTab('services')}>
                    <Text style={styles.seeAllText}>See all {filteredServices.length} services</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* No Results */}
            {totalResults === 0 && (
              <View style={styles.noResults}>
                <View style={styles.noResultsIcon}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSubtitle}>Try adjusting your search terms or browse categories</Text>
              </View>
            )}
            </>
            )}
          </>
        )}

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
    paddingBottom: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: 10,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  // Recent Searches
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  recentText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  // Popular Categories
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  popularCard: {
    width: (Dimensions.get('window').width - SPACING.md * 2 - 10) / 3,
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  popularIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Results
  resultSummary: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  resultItem: {
    marginBottom: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  resultImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultPrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultMeta: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  resultRatingText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  noResultsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  noResultsTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  noResultsSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
