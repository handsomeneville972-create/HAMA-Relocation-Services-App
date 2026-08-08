import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CommunityPostCard } from '../components/CommunityPost';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ResponsiveGrid } from '../components/ResponsiveGrid';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { getCommunityPosts } from '../services/communityService';
import { getLocalPosts } from '../utils/localPosts';
import { useResponsive } from '../utils/responsive';
import type { CommunityPost } from '../constants/types';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'for-you' | 'trending' | 'following';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'for-you', label: 'For You', icon: 'home' },
  { key: 'trending', label: 'Trending', icon: 'flame' },
  { key: 'following', label: 'Following', icon: 'people' },
];

const PAGE_SIZE = 20;

export const CommunityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, isPhone, isTablet } = useResponsive();
  const router = useRouter();
  const { currentUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('for-you');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 32) / 3;

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const { data } = await getCommunityPosts({
      currentUserId,
      limit: PAGE_SIZE,
      offset: (pageNum - 1) * PAGE_SIZE,
    });
    if (data) {
      setPosts(prev => {
        if (!append) {
          return [...getLocalPosts(), ...data];
        }
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...data.filter(p => !seen.has(p.id))];
      });
      setHasMore(data.length === PAGE_SIZE);
    }
  }, [currentUserId]);

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

  const handleTabChange = (tab: TabType, index: number) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: index,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  const visiblePosts = useMemo(() => {
    if (activeTab === 'trending') {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    return posts;
  }, [posts, activeTab]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/CreatePost')}>
              <Ionicons name="add-circle" size={26} color={COLORS.primary} />
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
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
                color={activeTab === tab.key ? COLORS.primary : COLORS.textTertiary}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ad Banner — Coming Soon */}
        <View style={styles.adBanner}>
          <View style={styles.adBannerContent}>
            <Ionicons name="megaphone-outline" size={18} color={COLORS.primary} />
            <Text style={styles.adBannerLabel}>Advertisement</Text>
          </View>
          <Text style={styles.adBannerTitle}>Coming Soon</Text>
          <Text style={styles.adBannerDesc}>Ad spaces in the community feed will be available soon.</Text>
        </View>

        {/* Posts */}
        <View style={styles.postsContainer}>
          {loading ? (
            <ResponsiveGrid columns={isPhone ? 1 : isTablet ? 2 : 3}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ width: '100%' }}>
                  <SkeletonLoader type="post" />
                </View>
              ))}
            </ResponsiveGrid>
          ) : activeTab === 'following' ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>You're not following anyone yet</Text>
              <Text style={styles.emptyText}>
                Follow community members to see their posts here. For now, check out the For You and Trending tabs!
              </Text>
            </View>
          ) : visiblePosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Be the first to share something with the community!</Text>
            </View>
          ) : (
            <ResponsiveGrid columns={isPhone ? 1 : isTablet ? 2 : 3}>
              {visiblePosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                />
              ))}
            </ResponsiveGrid>
          )}
          {!loading && visiblePosts.length > 0 && hasMore && (
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
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
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
    color: COLORS.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  indicatorContainer: {
    height: 2,
    backgroundColor: COLORS.glassBorder,
    marginTop: 0,
  },
  indicator: {
    width: '33.33%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  adBanner: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  adBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adBannerLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adBannerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  adBannerDesc: {
    color: COLORS.textTertiary,
    fontSize: 12,
    lineHeight: 16,
  },
  postsContainer: {
    paddingHorizontal: SPACING.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
