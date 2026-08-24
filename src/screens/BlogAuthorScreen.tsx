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
import { getBlogPosts, getBlogCategories, getBlogAuthors } from '../services/blogService';
import { MOCK_BLOG_AUTHORS } from '../constants/blogMockData';
import type { BlogPost, BlogAuthor, BlogCategory } from '../constants/types';

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

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return '?';
};

export const BlogAuthorScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const reducedMotion = useReducedMotion();

  const [author, setAuthor] = useState<BlogAuthor | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      const matchedAuthor = MOCK_BLOG_AUTHORS.find((a) => a.slug === slug) ?? null;
      setAuthor(matchedAuthor);

      const [catsRes] = await Promise.all([getBlogCategories()]);
      if (catsRes.data) setCategories(catsRes.data);

      if (matchedAuthor) {
        const res = await getBlogPosts();
        if (res.data) {
          setPosts(res.data.filter((p) => p.authorId === matchedAuthor.id));
        }
      }

      setLoading(false);
    };

    fetchData();
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
      {/* Profile skeleton */}
      <View style={styles.skeletonProfile}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonName} />
        <View style={styles.skeletonBio} />
        <View style={styles.skeletonBioShort} />
      </View>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <LinearGradient
            colors={colors.gradientSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.skeletonCardImage}
          />
          <View style={styles.skeletonCardContent}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonCardTitle} />
            <View style={styles.skeletonCardExcerpt} />
            <View style={styles.skeletonCardMeta} />
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
        <Ionicons name="pencil-outline" size={40} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No articles yet</Text>
      <Text style={styles.emptySubtitle}>
        This author hasn't published any articles yet. Check back soon.
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
          <Text style={styles.headerTitle}>Author</Text>
          <View style={styles.backButton} />
        </View>

        {loading ? (
          renderSkeletons()
        ) : !author ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Author not found</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* ─── Author Profile Card ─── */}
            <GlassCard style={styles.profileCard}>
              <View style={styles.profileCenter}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarInitials}>
                    {getInitials(author.name)}
                  </Text>
                </LinearGradient>
                <Text style={styles.authorName}>{author.name}</Text>
                <Text style={styles.authorBio}>{author.bio}</Text>
                <View style={styles.socialRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.socialBtn}
                  >
                    <Ionicons
                      name="logo-twitter"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.socialBtn}
                  >
                    <Ionicons
                      name="logo-linkedin"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.socialBtn}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>

            {/* ─── Articles Section ─── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Articles by {author.name.split(' ')[0]}
              </Text>
            </View>

            {posts.length === 0 ? (
              renderEmpty()
            ) : (
              <View style={styles.articleList}>
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
              </View>
            )}
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
    justifyContent: 'space-between',
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
  headerTitle: {
    ...FONTS.h3,
    color: colors.text,
  },

  /* Profile */
  profileCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileCenter: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarInitials: {
    ...FONTS.h1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  authorName: {
    ...FONTS.h2,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  authorBio: {
    ...FONTS.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section */
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: colors.text,
  },

  /* Articles */
  articleList: {
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
    gap: SPACING.md,
  },
  skeletonProfile: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonName: {
    width: 140,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
  },
  skeletonBio: {
    width: '80%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
  skeletonBioShort: {
    width: '50%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonCardImage: {
    width: 120,
    minHeight: 140,
  },
  skeletonCardContent: {
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
  skeletonCardTitle: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    width: '80%',
  },
  skeletonCardExcerpt: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    width: '100%',
  },
  skeletonCardMeta: {
    width: 100,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
});
