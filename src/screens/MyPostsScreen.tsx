import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getCommunityPosts } from '../services/communityService';
import type { CommunityPost } from '../constants/types';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const TYPE_LABELS: Record<string, string> = {
  photo: 'Photo',
  video: 'Video',
  tip: 'Tip',
  review: 'Review',
  experience: 'Experience',
  neighborhood: 'Neighborhood',
  advice: 'Advice',
};

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
};

export const MyPostsScreen: React.FC<{ navigation: any; userId?: string }> = ({ navigation, userId }) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await getCommunityPosts({ userId, currentUserId: userId });
    setPosts(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>My Posts</Text>
            <Text style={styles.headerSubtitle}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm }}>
          <SkeletonLoader type="post" count={3} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Posts you share in the community will show up here with their views and interactions.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
        >
          {posts.map(post => (
            <TouchableOpacity
              key={post.id}
              activeOpacity={0.9}
              style={styles.cardWrap}
              onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            >
              <GlassCard>
                <View style={styles.postRow}>
                  {post.image || post.video ? (
                    <Image
                      source={{ uri: post.image ?? 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600' }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Ionicons name={post.video ? 'videocam' : 'document-text'} size={24} color={COLORS.textTertiary} />
                    </View>
                  )}

                  <View style={styles.postInfo}>
                    <View style={styles.postTopRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{TYPE_LABELS[post.type] ?? post.type}</Text>
                      </View>
                      <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                    </View>
                    <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Ionicons name="eye-outline" size={15} color={COLORS.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.views)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="heart-outline" size={15} color={COLORS.secondary} />
                    <Text style={styles.statText}>{formatCount(post.likes)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.comments)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="arrow-redo-outline" size={15} color={COLORS.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.shares)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="bookmark-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.statText}>{formatCount(post.bookmarks)}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  cardWrap: {
    marginBottom: SPACING.sm,
  },
  postRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    flex: 1,
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postDate: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  postContent: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    paddingTop: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  emptySubtitle: {
    color: COLORS.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
