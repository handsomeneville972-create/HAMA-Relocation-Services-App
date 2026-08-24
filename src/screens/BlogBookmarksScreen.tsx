import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { BlogPost } from '../constants/types';

const GRADIENT_COVERS = [
  ['#FF6B00', '#FF8A33'] as const,
  ['#CC5500', '#FFB84D'] as const,
  ['#FF8A33', '#FFB366'] as const,
  ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,
  ['#FF6B00', '#FFFFFF'] as const,
];

export const BlogBookmarksScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { currentUserId } = useAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnims = useRef<Animated.Value[]>([]).current;

  const fetchBookmarks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setLoading(!isRefresh);

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select('post_id, blog_posts!inner(*, category:blog_categories(*), author:blog_authors(*))')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const extractedPosts = data.map((row: any) => row.blog_posts).filter(Boolean);
      setPosts(extractedPosts);

      fadeAnims.length = 0;
      extractedPosts.forEach(() => {
        fadeAnims.push(new Animated.Value(0));
      });

      if (!reducedMotion) {
        extractedPosts.forEach((_: any, i: number) => {
          Animated.timing(fadeAnims[i], {
            toValue: 1,
            duration: 400,
            delay: i * 80,
            useNativeDriver: true,
          }).start();
        });
      } else {
        fadeAnims.forEach((v) => v.setValue(1));
      }
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, [currentUserId]);

  const handleRefresh = () => {
    fetchBookmarks(true);
  };

  const getCategoryName = (post: BlogPost) =>
    post.category?.name ?? 'General';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.skeletonImage}
          />
          <View style={styles.skeletonBody}>
            <SkeletonLoader type="text" count={3} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bookmark-outline" size={56} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No saved articles</Text>
      <Text style={styles.emptySubtitle}>
        Tap the bookmark icon on any article to save it
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/Blog')}
        style={styles.emptyButton}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Browse Articles</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        refreshControl={
          <Animated.View style={refreshing ? { opacity: 1 } : { opacity: 0 }}>
            <View style={styles.refreshIndicator}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </View>
          </Animated.View>
        }
        onScrollBeginDrag={() => {
          if (!refreshing) handleRefresh();
        }}
        scrollEventThrottle={800}
      >
        {loading ? (
          renderSkeleton()
        ) : posts.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.cardList}>
            {posts.map((post, i) => (
              <Animated.View
                key={post.id}
                style={{
                  opacity: fadeAnims[i] ?? new Animated.Value(1),
                  transform: [
                    {
                      translateY: (fadeAnims[i] ?? new Animated.Value(1)).interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/BlogPost?slug=${post.slug}`)}
                >
                  <GlassCard noPadding>
                    <View style={styles.cardInner}>
                      <LinearGradient
                        colors={GRADIENT_COVERS[i % GRADIENT_COVERS.length]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardCover}
                      />
                      <View style={styles.cardContent}>
                        <View style={styles.cardBadgeRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {getCategoryName(post)}
                            </Text>
                          </View>
                          <View style={styles.readingTimeBadge}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.readingTimeText}>
                              {post.readingTime} min read
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {post.title}
                        </Text>
                        <Text style={styles.cardExcerpt} numberOfLines={2}>
                          {post.excerpt}
                        </Text>
                        <View style={styles.cardMeta}>
                          <Text style={styles.authorName}>
                            {post.author?.name ?? 'HAMA'}
                          </Text>
                          <Text style={styles.dateText}>
                            {formatDate(post.publishedAt ?? '')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + SPACING.lg }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      ...FONTS.h2,
      color: colors.text,
      textAlign: 'center',
      marginRight: 36,
    },
    headerRight: {
      width: 36,
    },

    /* Skeleton */
    skeletonContainer: {
      paddingHorizontal: SPACING.md,
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    skeletonCard: {
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skeletonImage: {
      width: '100%',
      height: 120,
    },
    skeletonBody: {
      padding: SPACING.md,
    },

    /* Empty State */
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.xl,
      paddingTop: 80,
    },
    emptyIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    emptyTitle: {
      ...FONTS.h2,
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    emptySubtitle: {
      ...FONTS.bodySmall,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: SPACING.xl,
    },
    emptyButton: {
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    emptyButtonGradient: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
    },
    emptyButtonText: {
      ...FONTS.bodySmall,
      color: '#FFFFFF',
      fontWeight: '700',
    },

    /* Card List */
    cardList: {
      paddingHorizontal: SPACING.md,
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    cardInner: {
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
    },
    cardCover: {
      width: '100%',
      height: 140,
    },
    cardContent: {
      padding: SPACING.md,
    },
    cardBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    categoryBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: RADIUS.sm,
    },
    categoryBadgeText: {
      ...FONTS.caption,
      color: '#000000',
      fontWeight: '600',
    },
    readingTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readingTimeText: {
      ...FONTS.caption,
      color: colors.textTertiary,
    },
    cardTitle: {
      ...FONTS.h3,
      color: colors.text,
      marginBottom: 4,
    },
    cardExcerpt: {
      ...FONTS.bodySmall,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: SPACING.sm,
    },
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    authorName: {
      ...FONTS.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    dateText: {
      ...FONTS.caption,
      color: colors.textTertiary,
    },

    /* Refresh indicator */
    refreshIndicator: {
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
  });
