import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PropertyCard } from '../components/PropertyCard';
import { StaggerItem } from '../components/StaggerItem';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getFeaturedProperties, searchProperties } from '../services/propertyService';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { Property } from '../constants/types';

const { width } = Dimensions.get('window');

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'apartments', label: 'Apartments', icon: 'business-outline' },
  { key: 'houses', label: 'Houses', icon: 'home-outline' },
  { key: 'bedsitters', label: 'Bedsitters', icon: 'bed-outline' },
  { key: 'studios', label: 'Studios', icon: 'film-outline' },
  { key: 'villas', label: 'Villas', icon: 'castle-outline' },
  { key: 'maisonettes', label: 'Maisonettes', icon: 'layers-outline' },
  { key: 'offices', label: 'Office Space', icon: 'briefcase-outline' },
  { key: 'commercial', label: 'Commercial', icon: 'storefront-outline' },
  { key: 'land', label: 'Land', icon: 'map-outline' },
  { key: 'hostels', label: 'Hostels', icon: 'people-outline' },
  { key: 'student', label: 'Student Housing', icon: 'school-outline' },
  { key: 'shortstay', label: 'Short Stay', icon: 'time-outline' },
  { key: 'luxury', label: 'Luxury', icon: 'diamond-outline' },
  { key: 'family', label: 'Family Homes', icon: 'heart-outline' },
  { key: 'petfriendly', label: 'Pet Friendly', icon: 'paw-outline' },
];

// ============================================================
// FILTER OPTIONS
// ============================================================

const FILTER_SECTIONS = [
  {
    title: 'Property Type',
    options: ['All', 'Apartment', 'House', 'Bedsitter', 'Studio', 'Villa', 'Maisonette', 'Office', 'Commercial', 'Land'],
  },
  {
    title: 'Bedrooms',
    options: ['Any', '1', '2', '3', '4', '5+'],
  },
  {
    title: 'Bathrooms',
    options: ['Any', '1', '2', '3', '4+'],
  },
  {
    title: 'Price Range',
    options: ['Any', 'Under KSh 20,000', 'KSh 20,000 - 50,000', 'KSh 50,000 - 100,000', 'Over KSh 100,000'],
  },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'lowest', label: 'Lowest Price' },
  { key: 'highest', label: 'Highest Price' },
  { key: 'nearest', label: 'Nearest' },
  { key: 'trending', label: 'Trending' },
  { key: 'mostviewed', label: 'Most Viewed' },
  { key: 'mostsaved', label: 'Most Saved' },
];

// ============================================================
// MOVING SERVICES BANNER
// ============================================================

const MovingServicesBanner: React.FC = () => (
  <View style={styles.bannerContainer}>
    <LinearGradient
      colors={['rgba(255,107,0,0.08)', 'rgba(255,107,0,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bannerGradient}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerIconContainer}>
          <Ionicons name="car-outline" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Need help moving?</Text>
          <Text style={styles.bannerSubtitle}>
            Book the Hamisha Squad for a stress-free relocation.
          </Text>
        </View>
        <TouchableOpacity style={styles.bannerButton} activeOpacity={0.8}>
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerButtonGradient}
          >
            <Text style={styles.bannerButtonText}>Book Now</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </View>
);

// ============================================================
// FILTER BOTTOM SHEET
// ============================================================

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  activeFilters: any;
}

const FilterBottomSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  activeFilters,
}) => {
  const [filters, setFilters] = useState(activeFilters);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={handleClose}>
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [Dimensions.get('window').height, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Filter Content */}
            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {FILTER_SECTIONS.map((section, sIndex) => (
                <View key={sIndex} style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{section.title}</Text>
                  <View style={styles.filterOptions}>
                    {section.options.map((option, oIndex) => (
                      <TouchableOpacity
                        key={oIndex}
                        activeOpacity={0.7}
                        style={[
                          styles.filterChip,
                          filters[section.title] === option && styles.filterChipActive,
                        ]}
                        onPress={() => setFilters({ ...filters, [section.title]: option })}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            filters[section.title] === option && styles.filterChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.filterOptions}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.7}
                      style={[
                        styles.filterChip,
                        filters.sortBy === option.key && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, sortBy: option.key })}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.sortBy === option.key && styles.filterChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setFilters({})}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  onApply(filters);
                  handleClose();
                }}
              >
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Show Results</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================================
// MAIN SCREEN
// ============================================================

export const FeaturedPropertiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [favouritedIds, setFavouritedIds] = useState<Set<string>>(new Set());

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Fetch properties
  const fetchProperties = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const result = await getFeaturedProperties({
        limit: 20,
        offset: (pageNum - 1) * 20,
        category: activeCategory,
      });
      if (result.data) {
        if (append) {
          setProperties(prev => [...prev, ...result.data!]);
        } else {
          setProperties(result.data);
        }
        setHasMore(result.data.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProperties(1);
  }, []);

  // Refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchProperties(1);
  }, [fetchProperties]);

  // Load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProperties(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchProperties]);

  // Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchProperties(1);
      return;
    }
    setLoading(true);
    const result = await searchProperties(searchQuery);
    if (result.data) {
      setProperties(result.data);
    }
    setLoading(false);
  }, [searchQuery, fetchProperties]);

  // Toggle favourite
  const toggleFavourite = useCallback((id: string) => {
    setFavouritedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Render property card
  const renderPropertyCard = useCallback(({ item, index }: { item: Property; index: number }) => {
    // Insert moving services banner after every 6 cards
    if (index > 0 && index % 6 === 0) {
      return (
        <>
          <MovingServicesBanner />
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
            onFavourite={() => toggleFavourite(item.id)}
            isFavourited={favouritedIds.has(item.id)}
          />
        </>
      );
    }

    return (
      <PropertyCard
        property={item}
        onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
        onFavourite={() => toggleFavourite(item.id)}
        isFavourited={favouritedIds.has(item.id)}
      />
    );
  }, [navigation, toggleFavourite, favouritedIds]);

  // Key extractor
  const keyExtractor = useCallback((item: Property) => item.id, []);

  // List footer (loading more indicator)
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="home-outline" size={48} color={COLORS.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>No featured properties found</Text>
        <Text style={styles.emptySubtitle}>Try changing your filters or search terms</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            setActiveFilters({});
            setSearchQuery('');
            setActiveCategory('all');
            fetchProperties(1);
          }}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>Reset Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }, [loading, fetchProperties]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + SPACING.sm, opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/hama-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>HAMA™</Text>
              <Text style={styles.headerSubtitle}>Need a house homie? We've got you.</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingTop: insets.top + 70 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, property or keyword..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat, i) => (
            <StaggerItem key={cat.key} index={i}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  activeCategory === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={activeCategory === cat.key ? '#fff' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === cat.key && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </StaggerItem>
          ))}
        </ScrollView>
      </View>

      {/* Property List */}
      {loading ? (
        <FlatList
          data={Array.from({ length: 5 })}
          keyExtractor={(_, i) => `skeleton-${i}`}
          renderItem={() => (
            <View style={styles.skeletonContainer}>
              <SkeletonLoader type="card" />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={keyExtractor}
          renderItem={renderPropertyCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          // Apply filters to property list
        }}
        activeFilters={activeFilters}
      />
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: SPACING.md,
    height: 52,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    paddingVertical: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Categories
  categoryContainer: {
    paddingBottom: SPACING.sm,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181818',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // List
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  skeletonContainer: {
    marginBottom: SPACING.md,
  },
  // Loading more
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.lg,
  },
  loadingMoreText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  emptyButtonGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  emptyButtonText: {
    ...FONTS.button,
    color: '#fff',
  },
  // Banner
  bannerContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
  },
  bannerGradient: {
    padding: SPACING.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bannerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  bannerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bannerButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  bannerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  bannerButtonText: {
    ...FONTS.button,
    color: '#fff',
    fontSize: 14,
  },
  // Filter Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  sheetContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterSectionTitle: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#181818',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resetButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  resetButtonText: {
    ...FONTS.button,
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  applyButtonText: {
    ...FONTS.button,
    color: '#fff',
  },
});
