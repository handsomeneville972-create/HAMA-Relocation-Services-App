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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { StaggerItem } from '../components/StaggerItem';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { getBlogPosts, getBlogCategories } from '../services/blogService';
import type { BlogPost, BlogCategory } from '../constants/types';

const GRADIENT_COVERS: readonly [string, string][] = [
  ['#FF6B00', '#FF8A33'],
  ['#CC5500', '#FFB84D'],
  ['#FF8A33', '#FFB366'],
  ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
  ['#FF6B00', '#FFFFFF'],
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const BlogCategoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug, name } = useLocalSearchParams<{ slug: string; name: string }>();
  const reducedMotion = useReducedMotion();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      const [catsRes] = await Promise.all([getBlogCategories()]);
      if (catsRes.data) {
        setCategories(catsRes.data);
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const res = await getBlogPosts({ categorySlug: slug !== 'all' ? slug : undefined });
      if (res.data) setPosts(res.data);
      setLoading(false);
    };

    fetchPosts();
  }, [slug]);

  useEffect(() => {
    if (!loading) {
      if (reducedMotion) {
        fadeAnim.setValue(1);
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [loading, fadeAnim, reducedMotion]);

  const handleBack = () => router.back();

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? 'General';

  const renderSkeletons = () => (
    <View style={styles.skeletonList}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <LinearGradient
            colors={colors.gradientSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.skeletonImage}
          />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonExcerpt} />
            <View style={styles.skeletonMeta} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(255,107,0,0.12)', 'rgba(255,107,0,0.04)']}
        style={styles.emptyIconWrap}
      >
        <Ionicons
          name="document-text-outline"
          size={40}
          color={colors.primary}
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No articles yet</Text>
      <Text style={styles.emptySubtitle}>
        No articles in this category yet. Check back soon for new content.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Header ─── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name || 'Category'}
            </Text>
            <Text style={styles.headerCount}>
              {loading ? '...' : `${posts.length} article${posts.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* ─── Content ─── */}
        {loading ? (
          renderSkeletons()
        ) : posts.length === 0 ? (
          renderEmpty()
        ) : (
          <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
            {posts.map((post, i) => (
              <StaggerItem key={post.id} index={i} style={styles.cardItem}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(`/BlogPost?slug=${post.slug}`)
                  }
                >
                  <GlassCard noPadding>
                    <View style={styles.cardRow}>
                      <LinearGradient
                        colors={
                          GRADIENT_COVERS[i % GRADIENT_COVERS.length]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardImage}
                      />
                      <View style={styles.cardContent}>
                        <View style={styles.cardBadges}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {getCategoryName(post.categoryId ?? '')}
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
                          <View style={styles.readingTime}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.readingTimeText}>
                              {post.readingTime} min read
                            </Text>
                          </View>
                          <Text style={styles.dateText}>
                            {formatDate(post.publishedAt ?? '')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </StaggerItem>
            ))}
          </Animated.View>
        )}
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
  scrollContent: {
    paddingBottom: SPACING.xl,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.h2,
    color: colors.text,
  },
  headerCount: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },

  /* Card list */
  listContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  cardItem: {
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: 120,
    minHeight: 140,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
    gap: 4,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  categoryBadgeText: {
    ...FONTS.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  cardTitle: {
    ...FONTS.body,
    color: colors.text,
    fontWeight: '600',
  },
  cardExcerpt: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  readingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingTimeText: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  dateText: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },

  /* Empty */
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Skeleton */
  skeletonList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonImage: {
    width: 120,
    minHeight: 140,
  },
  skeletonContent: {
    flex: 1,
    padding: SPACING.sm,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  skeletonBadge: {
    width: 60,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    width: '80%',
  },
  skeletonExcerpt: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    width: '100%',
  },
  skeletonMeta: {
    width: 100,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
});
