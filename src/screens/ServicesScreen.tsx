import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceCard } from '../components/ServiceCard';
import { CategoryGrid } from '../components/CategoryGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PaywallOverlay } from '../components/PaywallOverlay';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ResponsiveGrid } from '../components/ResponsiveGrid';
import { SERVICE_CATEGORIES } from '../constants/data';
import { getServiceProviders } from '../services/serviceProviderService';
import { softSanitize } from '../utils/sanitize';
import { useResponsive } from '../utils/responsive';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { ServiceProvider } from '../constants/types';

interface ServicesScreenProps {
  navigation: any;
  isSeekerLocked?: boolean;
}

const PAGE_SIZE = 20;

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation, isSeekerLocked = false }) => {
  const insets = useSafeAreaInsets();
  const { isPhone, isTablet } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const { data } = await getServiceProviders({
      category: selectedCategory || undefined,
      limit: PAGE_SIZE,
      offset: (pageNum - 1) * PAGE_SIZE,
    });
    if (data) {
      setProviders(prev => (append ? [...prev, ...data] : data));
      setHasMore(data.length === PAGE_SIZE);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1);
    fetchPage(1, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true).finally(() => setLoadingMore(false));
  };

  const filteredProviders = selectedCategory
    ? providers.filter(p => p.category === selectedCategory)
    : providers;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Home Services</Text>
          <Text style={styles.headerSubtitle}>Professional services for your home</Text>
        </View>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find a service provider..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(softSanitize(text))}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured Banner */}
        <ResponsiveContainer padding={0}>
          {loading ? (
            <View style={styles.featuredBanner}>
              <SkeletonLoader type="banner" />
            </View>
          ) : (
            <View style={styles.featuredBanner}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('BecomeProvider')}>
                <LinearGradient colors={['rgba(255,107,0,0.22)', 'rgba(255,107,0,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerGradient}>
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerText}>
                      <Text style={styles.bannerTitle}>Grow your business with HAMA</Text>
                      <Text style={styles.bannerSubtitle}>Free to join — go live today and get found by nearby clients</Text>
                    </View>
                    <View style={styles.bannerIcon}>
                      <Ionicons name="storefront" size={34} color={COLORS.primary} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ResponsiveContainer>

        {/* Categories */}
        <ResponsiveContainer padding={0}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
        </ResponsiveContainer>
        {loading ? (
          <ResponsiveContainer padding={0}>
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={{ width: 60, alignItems: 'center' }}>
                    <SkeletonLoader type="circle" />
                  </View>
                ))}
              </View>
            </View>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer padding={0}>
            <CategoryGrid
              categories={SERVICE_CATEGORIES}
              selected={selectedCategory}
              onSelect={(name) => setSelectedCategory(selectedCategory === name ? '' : name)}
              variant="list"
            />
          </ResponsiveContainer>
        )}

        {/* Providers */}
        <ResponsiveContainer padding={0}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory ? selectedCategory : 'All Providers'}
              </Text>
              <Text style={styles.providerCount}>{loading ? '...' : `${filteredProviders.length} available`}</Text>
            </View>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SkeletonLoader key={i} type="list" />
              ))
            ) : (
              <ResponsiveGrid columns={isPhone ? 1 : isTablet ? 2 : 2}>
                {filteredProviders.map((provider) => (
                  <ServiceCard
                    key={provider.id}
                    provider={provider}
                    onPress={() => {
                      if (isSeekerLocked) { setPaywallVisible(true); return; }
                      navigation.navigate('ServiceProviderProfile', { providerId: provider.id });
                    }}
                  />
                ))}
              </ResponsiveGrid>
            )}
            {!loading && filteredProviders.length > 0 && hasMore && (
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
          </View>
        </ResponsiveContainer>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Paywall for gated provider taps */}
      <PaywallOverlay
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
      />
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
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
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
  featuredBanner: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerGradient: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.2)',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,212,170,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  providerCount: {
    color: COLORS.textTertiary,
    fontSize: 13,
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
