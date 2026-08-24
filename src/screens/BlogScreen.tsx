import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { StaggerItem } from '../components/StaggerItem';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getBlogPosts,
  getBlogCategories,
} from '../services/blogService';
import { logBlogEvent } from '../services/blogEventService';
import { getRecommendedPosts, getContinueReading } from '../services/blogReadingHistoryService';
import type { BlogPost, BlogCategory } from '../constants/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getHeroSlides = (colors: ThemeColors) => [
  {
    gradient: colors.gradientPrimary as readonly [string, string],
    caption: 'Find Your Dream Home',
  },
  {
    gradient: ['#FF8A33', '#FFB84D'] as const,
    caption: 'Smart Moving Guides',
  },
  {
    gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.04)'] as const,
    caption: 'Neighbourhood Insights',
  },
  {
    gradient: ['#CC5500', '#FF6B00'] as const,
    caption: 'Budget & Finance Tips',
  },
  {
    gradient: ['#FFB366', '#FF6B00'] as const,
    caption: 'Home Services On Demand',
  },
];

const NEIGHBOURHOODS = [
  'Westlands',
  'Karen',
  'Kilimani',
  'Lavington',
  'Kasarani',
  'Ruaka',
];

const SERVICES = [
  { icon: 'flash-outline', label: 'Electricians', slug: 'electricians' },
  { icon: 'sparkles-outline', label: 'Cleaners', slug: 'cleaners' },
  { icon: 'grid-outline', label: 'More Services', slug: 'all' },
];

const GRADIENT_COVERS = [
  ['#FF6B00', '#FF8A33'] as const,
  ['#CC5500', '#FFB84D'] as const,
  ['#FF8A33', '#FFB366'] as const,
  ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,
  ['#FF6B00', '#FFFFFF'] as const,
];

export const BlogScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroSlides = useMemo(() => getHeroSlides(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { currentUserId } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<BlogPost[]>([]);
  const [continueReading, setContinueReading] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const carouselOpacity = useRef(new Animated.Value(1)).current;
  const carouselInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, catsRes, trendRes] = await Promise.all([
        getBlogPosts({ limit: 20 }),
        getBlogCategories(),
        getBlogPosts({ limit: 5, featured: true }),
      ]);

      if (postsRes.data) setPosts(postsRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (trendRes.data) setTrendingPosts(trendRes.data);
      setLoading(false);

      // Fetch personalized recommendations (fire-and-forget)
      if (currentUserId) {
        const postIds = (postsRes.data ?? []).map((p) => p.id);
        getRecommendedPosts(currentUserId, postIds, 4).then(({ data }) => {
          if (data) setRecommendedPosts(data);
        });
        getContinueReading(currentUserId, 3).then(({ data }) => {
          if (data) setContinueReading(data);
        });
      }
    };

    fetchData();
  }, []);

  const startCarouselTimer = useCallback(() => {
    if (carouselInterval.current) clearInterval(carouselInterval.current);
    carouselInterval.current = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        if (!reducedMotion) {
          Animated.timing(carouselOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            carouselOpacity.setValue(0);
            Animated.timing(carouselOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }).start();
          });
        }
        return next;
      });
    }, 6000);
  }, [carouselOpacity, reducedMotion]);

  useEffect(() => {
    startCarouselTimer();
    return () => {
      if (carouselInterval.current) clearInterval(carouselInterval.current);
    };
  }, [startCarouselTimer]);

  const pauseCarousel = () => {
    if (carouselInterval.current) clearInterval(carouselInterval.current);
  };

  const resumeCarousel = () => startCarouselTimer();

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter((p) => p.categoryId === activeCategory);

  const featuredPost = posts.find((p) => p.featured) ?? posts[0];
  const latestPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id).slice(0, 8);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? 'General';

  const formatViews = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      logBlogEvent('search', undefined, currentUserId, { query: searchQuery.trim() });
      router.push(`/BlogSearch?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ─── Header ─── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Your housing knowledge hub</Text>
        </View>

        {/* ─── Hero Carousel ─── */}
        <View
          style={styles.carouselContainer}
          onTouchStart={pauseCarousel}
          onTouchEnd={resumeCarousel}
        >
          <Animated.View style={{ opacity: carouselOpacity, flex: 1 }}>
            <LinearGradient
              colors={heroSlides[carouselIndex].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.carouselSlide}
            >
              <View style={styles.carouselOverlay}>
                <Text style={styles.carouselCaption}>
                  {heroSlides[carouselIndex].caption}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.dotRow}>
            {heroSlides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === carouselIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles, topics, guides..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── Category Chips ─── */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveCategory('all')}
              style={[
                styles.chip,
                activeCategory === 'all' && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === 'all' && styles.chipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.chip,
                  activeCategory === cat.id && styles.chipActive,
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={
                    activeCategory === cat.id
                      ? '#000000'
                      : colors.textSecondary
                  }
                  style={styles.chipIcon}
                />
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === cat.id && styles.chipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Featured Article ─── */}
        {featuredPost && (
          <View style={styles.section}>
            <StaggerItem index={0}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push(`/BlogPost?slug=${featuredPost.slug}`)
                }
              >
                <GlassCard noPadding>
                  <View style={styles.featuredCard}>
                    <LinearGradient
                      colors={
                        GRADIENT_COVERS[0]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.featuredImage}
                    >
                      <View style={styles.featuredImageOverlay} />
                    </LinearGradient>
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredBadgeRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {getCategoryName(featuredPost.categoryId ?? '')}
                          </Text>
                        </View>
                        <View style={styles.readingTimeBadge}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.readingTimeText}>
                            {featuredPost.readingTime} min read
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {featuredPost.title}
                      </Text>
                      <Text style={styles.featuredExcerpt} numberOfLines={2}>
                        {featuredPost.excerpt}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </StaggerItem>
          </View>
        )}

        {/* ─── Latest Articles Grid ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Articles</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/BlogCategory?slug=all&name=All Articles')}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.gridRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.gridCardPlaceholder}>
                  <LinearGradient
                    colors={colors.gradientSecondary}
                    style={styles.gridCardPlaceholderImg}
                  />
                  <View style={styles.gridCardPlaceholderText} />
                  <View style={styles.gridCardPlaceholderTextShort} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.gridRow}>
              {latestPosts.slice(0, 6).map((post, i) => (
                <StaggerItem key={post.id} index={i} style={styles.gridItem}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(`/BlogPost?slug=${post.slug}`)
                    }
                  >
                    <GlassCard noPadding>
                      <LinearGradient
                        colors={
                          GRADIENT_COVERS[i % GRADIENT_COVERS.length]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gridCardImage}
                      />
                      <View style={styles.gridCardContent}>
                        <View style={styles.categoryBadgeSmall}>
                          <Text style={styles.categoryBadgeSmallText}>
                            {getCategoryName(post.categoryId ?? '')}
                          </Text>
                        </View>
                        <Text style={styles.gridCardTitle} numberOfLines={2}>
                          {post.title}
                        </Text>
                        <Text style={styles.gridCardExcerpt} numberOfLines={2}>
                          {post.excerpt}
                        </Text>
                        <View style={styles.gridCardMeta}>
                          <View style={styles.readingTimeBadge}>
                            <Ionicons
                              name="time-outline"
                              size={10}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.gridCardMetaText}>
                              {post.readingTime} min
                            </Text>
                          </View>
                          <Text style={styles.gridCardMetaText}>
                            {formatDate(post.publishedAt ?? '')}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </StaggerItem>
              ))}
            </View>
          )}
        </View>

        {/* ─── Neighbourhood Guides ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Neighbourhood Guides</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  '/BlogCategory?slug=neighbourhoods&name=Neighbourhoods'
                )
              }
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {NEIGHBOURHOODS.map((name, i) => (
              <StaggerItem key={name} index={i} style={styles.hoodItem}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      `/BlogCategory?slug=neighbourhoods&name=${encodeURIComponent(name)}`
                    )
                  }
                >
                  <GlassCard
                    style={styles.hoodCard}
                    gradient={
                      GRADIENT_COVERS[i % GRADIENT_COVERS.length]
                    }
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.hoodOverlay}
                    />
                    <View style={styles.hoodContent}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.hoodName}>{name}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </StaggerItem>
            ))}
          </ScrollView>
        </View>

        {/* ─── Home Services ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Home Services</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/Services')}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {SERVICES.map((svc, i) => (
              <StaggerItem key={svc.slug} index={i} style={styles.serviceItem}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/Services')}
                >
                  <GlassCard style={styles.serviceCard}>
                    <View style={styles.serviceIconWrap}>
                      <Ionicons
                        name={svc.icon as any}
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.serviceLabel}>{svc.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              </StaggerItem>
            ))}
          </ScrollView>
        </View>

        {/* ─── Moving Guides & Budget Corner ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moving Guides & Budget</Text>
          </View>
          <View style={styles.gridRow}>
            <StaggerItem index={0} style={styles.gridItem}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push('/BlogCategory?slug=moving&name=Moving')
                }
              >
                <GlassCard gradient={colors.gradientPrimary}>
                  <Ionicons
                    name="car-outline"
                    size={28}
                    color="#000000"
                  />
                  <Text style={styles.guideCardTitle}>Moving Guides</Text>
                  <Text style={styles.guideCardSubtitle}>
                    Tips for a smooth relocation
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            </StaggerItem>
            <StaggerItem index={1} style={styles.gridItem}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push('/BlogCategory?slug=finance&name=Finance')
                }
              >
                <GlassCard gradient={colors.gradientSecondary}>
                  <Ionicons
                    name="wallet-outline"
                    size={28}
                    color={colors.primary}
                  />
                  <Text style={styles.guideCardTitleDark}>Budget Corner</Text>
                  <Text style={styles.guideCardSubtitleDark}>
                    Manage your housing finances
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            </StaggerItem>
          </View>
        </View>

        {/* ─── Continue Reading ─── */}
        {continueReading.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Continue Reading</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
              {continueReading.map((post, i) => (
                <StaggerItem key={post.id} index={i} style={styles.trendingItem}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/BlogPost?slug=${post.slug}`)}>
                    <GlassCard style={styles.trendingCard}>
                      <View style={styles.trendingRow}>
                        <View style={styles.trendingInfo}>
                          <Text style={styles.trendingTitle} numberOfLines={2}>{post.title}</Text>
                          <Text style={styles.trendingViews}>{post.readingTime} min read</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </StaggerItem>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── For You (Personalised) ─── */}
        {recommendedPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>For You</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/BlogCategory?slug=all&name=For You')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.latestGrid}>
              {recommendedPosts.map((post, i) => (
                <StaggerItem key={post.id} index={i} style={styles.gridItem}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/BlogPost?slug=${post.slug}`)}>
                    <GlassCard noPadding style={styles.articleCard}>
                      <LinearGradient colors={GRADIENT_COVERS[i % GRADIENT_COVERS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.articleCardImage}>
                        {post.coverImageUrl ? (
                          <Image source={{ uri: post.coverImageUrl }} style={styles.articleCardImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.articleCardPlaceholder}>H</Text>
                        )}
                        {post.category && (
                          <View style={styles.articleCardBadge}>
                            <Text style={styles.articleCardBadgeText}>{post.category.name}</Text>
                          </View>
                        )}
                      </LinearGradient>
                      <View style={styles.articleCardBody}>
                        <Text style={styles.articleCardTitle} numberOfLines={2}>{post.title}</Text>
                        <Text style={styles.articleCardExcerpt} numberOfLines={2}>{post.excerpt}</Text>
                        <View style={styles.articleCardMeta}>
                          <Text style={styles.articleCardDate}>{post.readingTime} min read</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </StaggerItem>
              ))}
            </View>
          </View>
        )}

        {/* ─── Trending Articles ─── */}
        {trendingPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flame-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Trending Now</Text>
              </View>
            </View>
            <View style={styles.trendingList}>
              {trendingPosts.map((post, i) => (
                <StaggerItem key={post.id} index={i} style={styles.trendingItem}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(`/BlogPost?slug=${post.slug}`)
                    }
                  >
                    <GlassCard style={styles.trendingCard}>
                      <View style={styles.trendingRow}>
                        <Text style={styles.trendingRank}>
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        <View style={styles.trendingInfo}>
                          <Text style={styles.trendingTitle} numberOfLines={1}>
                            {post.title}
                          </Text>
                          <View style={styles.trendingMeta}>
                            <Ionicons
                              name="eye-outline"
                              size={12}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.trendingViews}>
                              {formatViews(post.views)} views
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textTertiary}
                        />
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </StaggerItem>
              ))}
            </View>
          </View>
        )}

        {/* ─── Footer ─── */}
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>Stay in the loop</Text>
            <Text style={styles.footerSubtitle}>
              Get the latest articles, guides, and housing tips delivered to your inbox.
            </Text>
            <View style={styles.footerEmailRow}>
              <TextInput
                style={styles.footerEmailInput}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.footerEmailBtn} activeOpacity={0.8}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerBrandRow}>
              <Text style={styles.footerBrand}>HAMA™</Text>
              <Text style={styles.footerTagline}>
                Need a house homie? We've got you!
              </Text>
            </View>

            <View style={styles.footerSocials}>
              <TouchableOpacity style={styles.footerSocialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-twitter" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-tiktok" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-youtube" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.footerCopyright}>
              © 2026 HAMA. All rights reserved.
            </Text>
          </View>
        </View>

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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...FONTS.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },

  /* Carousel */
  carouselContainer: {
    height: 200,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  carouselSlide: {
    flex: 1,
    borderRadius: RADIUS.lg,
  },
  carouselOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: RADIUS.lg,
  },
  carouselCaption: {
    ...FONTS.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },

  /* Section */
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAll: {
    ...FONTS.bodySmall,
    color: colors.primaryLight,
    fontWeight: '600',
  },

  /* Category Chips */
  chipScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },

  /* Featured Article */
  featuredCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  featuredContent: {
    padding: SPACING.md,
  },
  featuredBadgeRow: {
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
  featuredTitle: {
    ...FONTS.h2,
    color: colors.text,
    marginBottom: 4,
  },
  featuredExcerpt: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  /* Grid */
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  gridItem: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2,
  },
  gridCardImage: {
    width: '100%',
    height: 110,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  gridCardContent: {
    padding: SPACING.sm,
  },
  categoryBadgeSmall: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryBadgeSmallText: {
    ...FONTS.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  gridCardTitle: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridCardExcerpt: {
    ...FONTS.caption,
    color: colors.textTertiary,
    lineHeight: 16,
    marginBottom: 6,
  },
  gridCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCardMetaText: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontSize: 10,
  },

  /* Grid placeholder */
  gridCardPlaceholder: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridCardPlaceholderImg: {
    width: '100%',
    height: 110,
  },
  gridCardPlaceholderText: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
  },
  gridCardPlaceholderTextShort: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
    marginTop: 6,
    width: '60%',
    marginBottom: SPACING.sm,
  },

  /* Horizontal scroll */
  horizontalScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },

  /* Neighbourhoods */
  hoodItem: {
    width: 140,
  },
  hoodCard: {
    width: 140,
    height: 100,
    justifyContent: 'flex-end',
  },
  hoodOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
  },
  hoodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.sm,
  },
  hoodName: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },

  /* Services */
  serviceItem: {
    width: 140,
  },
  serviceCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Moving Guides */
  guideCardTitle: {
    ...FONTS.h3,
    color: '#000000',
    marginTop: SPACING.sm,
  },
  guideCardSubtitle: {
    ...FONTS.bodySmall,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  guideCardTitleDark: {
    ...FONTS.h3,
    color: colors.text,
    marginTop: SPACING.sm,
  },
  guideCardSubtitleDark: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Trending */
  trendingList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  trendingItem: {
    width: '100%',
  },
  trendingCard: {
    paddingVertical: SPACING.md,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  trendingRank: {
    ...FONTS.title,
    color: 'rgba(255,255,255,0.1)',
    fontWeight: '800',
    width: 36,
    textAlign: 'center',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    ...FONTS.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingViews: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },

  /* Footer */
  footerContainer: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  footerTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginBottom: 4,
  },
  footerSubtitle: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  footerEmailRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: SPACING.lg,
  },
  footerEmailInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  footerEmailBtn: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: SPACING.lg,
  },
  footerBrandRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  footerBrand: {
    ...FONTS.h2,
    color: colors.text,
    fontWeight: '800',
  },
  footerTagline: {
    ...FONTS.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  footerSocials: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  footerSocialBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerCopyright: {
    ...FONTS.caption,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  /* For You / Recommended */
  latestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  articleCard: {
    overflow: 'hidden',
  },
  articleCardImage: {
    height: 120,
    justifyContent: 'flex-end',
  },
  articleCardPlaceholder: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    lineHeight: 120,
  },
  articleCardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  articleCardBadgeText: {
    ...FONTS.caption,
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  articleCardBody: {
    padding: SPACING.sm,
  },
  articleCardTitle: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  articleCardExcerpt: {
    ...FONTS.caption,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  articleCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleCardDate: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
});
