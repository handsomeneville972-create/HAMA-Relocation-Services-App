import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getCommunityPosts } from '../services/communityService';
import type { CommunityPost } from '../constants/types';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <Ionicons name="newspaper-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Posts you share in the community will show up here with their views and interactions.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
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
                      <Ionicons name={post.video ? 'videocam' : 'document-text'} size={24} color={colors.textTertiary} />
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
                    <Ionicons name="eye-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.views)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="heart-outline" size={15} color={colors.secondary} />
                    <Text style={styles.statText}>{formatCount(post.likes)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.comments)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="arrow-redo-outline" size={15} color={colors.textSecondary} />
                    <Text style={styles.statText}>{formatCount(post.shares)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="bookmark-outline" size={15} color={colors.primary} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: colors.text,
  },
  headerSubtitle: {
    color: colors.textTertiary,
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
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
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
    backgroundColor: colors.bgElevated,
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
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postDate: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  postContent: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.textSecondary,
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
    lineHeight: 20,
  },
});
