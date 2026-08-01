import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CommunityPostCard } from '../components/CommunityPost';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { getCommunityPosts } from '../services/communityService';
import type { CommunityPost } from '../constants/types';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'for-you' | 'trending' | 'following';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'for-you', label: 'For You', icon: 'home' },
  { key: 'trending', label: 'Trending', icon: 'flame' },
  { key: 'following', label: 'Following', icon: 'people' },
];

const TAB_WIDTH = (Dimensions.get('window').width - 32) / 3;

export const CommunityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('for-you');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCommunityPosts({ currentUserId }).then(({ data }) => {
      if (data) setPosts(data);
      setLoading(false);
    });
  }, [currentUserId]);

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
                    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2],
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
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} type="post" />
            ))
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
            visiblePosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              />
            ))
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
