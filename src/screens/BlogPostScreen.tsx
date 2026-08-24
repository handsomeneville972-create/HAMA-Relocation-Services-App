import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Dimensions,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  getBlogPostBySlug,
  incrementBlogViews,
} from '../services/blogService';
import { MOCK_BLOG_AUTHORS, MOCK_BLOG_POSTS } from '../constants/blogMockData';
import type { BlogPost, BlogBlock } from '../constants/types';
import { useAuth } from '../contexts/AuthContext';
import { toggleBlogBookmark, isBlogBookmarked } from '../services/blogService';
import { getBlogComments, createBlogComment, deleteBlogComment, likeBlogComment, getBlogCommentCount } from '../services/blogCommentService';
import { logBlogEvent } from '../services/blogEventService';
import { BlogCommentCard } from '../components/BlogComment';
import type { BlogComment as BlogCommentType } from '../constants/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRADIENT_COVERS: readonly (readonly [string, string])[] = [
  ['#FF6B00', '#FF8A33'],
  ['#CC5500', '#FFB84D'],
  ['#FF8A33', '#FFB366'],
  ['#1a1a2e', '#16213e'],
  ['#FF6B00', '#FFFFFF'],
];

const getCalloutColors = (colors: ThemeColors): Record<string, string> => ({
  info: colors.primary,
  tip: colors.success,
  warning: colors.warning,
});

const CALLOUT_ICONS: Record<string, string> = {
  info: 'information-circle-outline',
  tip: 'bulb-outline',
  warning: 'warning-outline',
};

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  index: number;
  style?: any;
}> = ({ children, index, style }) => {
  const reducedMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: reducedMotion ? 0 : index * 60,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, anim, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: reducedMotion
            ? []
            : [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const BlogPostScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const calloutColors = useMemo(() => getCalloutColors(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const reducedMotion = useReducedMotion();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeToc, setActiveToc] = useState<string>('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shared, setShared] = useState(false);
  const [commented, setCommented] = useState(false);

  const { currentUserId, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<BlogCommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const readCompleteFired = useRef(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const contentRefs = useRef<Record<string, React.RefObject<View>>>({});

  const progressWidth = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await getBlogPostBySlug(slug);
      if (data) {
        setPost(data);
        incrementBlogViews(data.id);
        logBlogEvent('view', data.id, currentUserId);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post || !currentUserId) return;
    isBlogBookmarked(currentUserId, post.id).then(({ data }) => {
      if (data !== null) setBookmarked(data);
    });
  }, [post?.id, currentUserId]);

  useEffect(() => {
    if (!post) return;
    getBlogComments(post.id).then(({ data }) => { if (data) setComments(data); });
    getBlogCommentCount(post.id).then(({ data }) => { if (data !== null) setCommentCount(data); });
  }, [post?.id]);

  useEffect(() => {
    if (!post || !currentUserId || readCompleteFired.current) return;
    const listener = scrollY.addListener(({ value }) => {
      if (value > 0.9 && !readCompleteFired.current) {
        readCompleteFired.current = true;
        logBlogEvent('read_complete', post.id, currentUserId);
      }
    });
    return () => scrollY.removeListener(listener);
  }, [post?.id, currentUserId]);

  useEffect(() => {
    if (post?.content) {
      const refs: Record<string, React.RefObject<View>> = {};
      post.content.forEach((block, i) => {
        if (block.type === 'heading' && block.text) {
          refs[block.text] = React.createRef();
        }
      });
      contentRefs.current = refs;
    }
  }, [post]);

  const author = post
    ? MOCK_BLOG_AUTHORS.find((a) => a.id === post.authorId) ?? MOCK_BLOG_AUTHORS[0]
    : MOCK_BLOG_AUTHORS[0];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post || !currentUserId) return;
    setSubmittingComment(true);
    const { data } = await createBlogComment(post.id, currentUserId, commentText.trim(), replyingTo ?? undefined);
    if (data) {
      if (replyingTo) {
        setComments((prev) => prev.map((c) =>
          c.id === replyingTo ? { ...c, replies: [...(c.replies ?? []), data] } : c
        ));
      } else {
        setComments((prev) => [...prev, data]);
      }
      setCommentCount((c) => c + 1);
    }
    setCommentText('');
    setReplyingTo(null);
    setSubmittingComment(false);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const tocBlocks =
    post?.content.filter(
      (b) => b.type === 'heading' && b.text
    ) ?? [];

  const scrollToSection = (text: string) => {
    const ref = contentRefs.current[text];
    if (ref?.current && scrollViewRef.current) {
      (ref.current as any).measureLayout(
        scrollViewRef.current as any,
        (y: number) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: !reducedMotion });
          setActiveToc(text);
        },
        () => {}
      );
    }
  };

  const relatedPosts = post
    ? MOCK_BLOG_POSTS.filter(
        (p) => p.categoryId === post.categoryId && p.id !== post.id
      ).slice(0, 3)
    : [];

  const allPosts = MOCK_BLOG_POSTS;
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${post.title} — Read on HAMA`,
        url: `https://hama.co.ke/blog/${post.slug}`,
      });
      setShared(true);
      logBlogEvent('share', post.id, currentUserId);
    } catch {}
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const renderContentBlock = (block: BlogBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = block.level === 2 ? 'h2' : 'h3';
        const refObj =
          block.text && contentRefs.current[block.text]
            ? { ref: contentRefs.current[block.text] }
            : {};
        return (
          <AnimatedSection key={index} index={index} {...refObj}>
            <Text
              style={
                block.level === 2 ? styles.heading2 : styles.heading3
              }
            >
              {block.text}
            </Text>
          </AnimatedSection>
        );

      case 'paragraph':
        return (
          <AnimatedSection key={index} index={index}>
            <Text style={styles.paragraph}>{block.text}</Text>
          </AnimatedSection>
        );

      case 'image':
        return (
          <AnimatedSection key={index} index={index} style={styles.imageContainer}>
            <LinearGradient
              colors={
                GRADIENT_COVERS[index % GRADIENT_COVERS.length]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imagePlaceholder}
            >
              <View style={styles.imageOverlay}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
            </LinearGradient>
            {block.caption && (
              <Text style={styles.imageCaption}>{block.caption}</Text>
            )}
          </AnimatedSection>
        );

      case 'list':
        return (
          <AnimatedSection key={index} index={index}>
            {block.items?.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listBullet}>
                  {block.ordered ? `${i + 1}.` : '\u2022'}
                </Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </AnimatedSection>
        );

      case 'callout':
        const tone = block.tone ?? 'info';
        return (
          <AnimatedSection key={index} index={index}>
            <GlassCard
              style={{
                ...styles.calloutCard,
                borderLeftColor: calloutColors[tone] ?? calloutColors.info,
              }}
              noPadding
            >
              <View style={styles.calloutInner}>
                <View
                  style={[
                    styles.calloutIconWrap,
                    { backgroundColor: `${calloutColors[tone]}20` },
                  ]}
                >
                  <Ionicons
                    name={CALLOUT_ICONS[tone] as any}
                    size={20}
                    color={calloutColors[tone]}
                  />
                </View>
                <Text style={styles.calloutText}>{block.text}</Text>
              </View>
            </GlassCard>
          </AnimatedSection>
        );

      case 'quote':
        return (
          <AnimatedSection key={index} index={index}>
            <View style={styles.quoteContainer}>
              <View style={styles.quoteBorder} />
              <View style={styles.quoteContent}>
                <Text style={styles.quoteText}>"{block.text}"</Text>
              </View>
            </View>
          </AnimatedSection>
        );

      case 'divider':
        return (
          <AnimatedSection key={index} index={index}>
            <View style={styles.divider} />
          </AnimatedSection>
        );

      case 'faq':
        return (
          <AnimatedSection key={index} index={index}>
            <View style={styles.faqSection}>
              <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
              {block.questions?.map((faq, i) => {
                const faqKey = `faq-${index}-${i}`;
                const isExpanded = expandedFaq === faqKey;
                const answerHeight = useRef(new Animated.Value(0)).current;

                const toggle = () => {
                  if (isExpanded) {
                    Animated.timing(answerHeight, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setExpandedFaq(null));
                  } else {
                    setExpandedFaq(faqKey);
                    Animated.timing(answerHeight, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }
                };

                return (
                  <TouchableOpacity
                    key={faqKey}
                    activeOpacity={0.8}
                    onPress={toggle}
                    style={styles.faqItem}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestion} numberOfLines={2}>
                        {faq.q}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textTertiary}
                      />
                    </View>
                    <Animated.View
                      style={{
                        maxHeight: answerHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        }),
                        overflow: 'hidden',
                        opacity: answerHeight,
                      }}
                    >
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedSection>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <View style={styles.loadingBar} />
          <View style={styles.loadingCover} />
          <View style={styles.loadingTitle} />
          <View style={styles.loadingTitleShort} />
          <View style={styles.loadingText} />
          <View style={styles.loadingText} />
          <View style={styles.loadingTextShort} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={[styles.notFoundContainer, { paddingTop: insets.top + SPACING.xl }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.notFoundTitle}>Article Not Found</Text>
          <Text style={styles.notFoundText}>
            The article you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/Blog')}
            style={styles.notFoundBtn}
          >
            <Text style={styles.notFoundBtnText}>Back to Discover</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reading Progress Bar */}
      <View style={[styles.progressTrack, { top: insets.top }]}>
        <Animated.View
          style={[styles.progressBar, { width: progressWidth }]}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={colors.gradientNight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroOverlay} />

            {/* Back Button */}
            <View style={[styles.heroTopBar, { paddingTop: insets.top + SPACING.sm }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {(post.categoryId ?? '')
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </Text>
              </View>
              <Text style={styles.heroTitle}>{post.title}</Text>
              <Text style={styles.heroExcerpt}>{post.excerpt}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Author Row */}
        <AnimatedSection index={0} style={styles.authorSection}>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitials}>
                {getInitials(author.name)}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{author.name}</Text>
              <View style={styles.authorMeta}>
                <Text style={styles.authorDate}>
                  {formatDate(post.publishedAt ?? '')}
                </Text>
                <Text style={styles.authorDot}>·</Text>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.textTertiary}
                />
                <Text style={styles.authorReadingTime}>
                  {post.readingTime} min read
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              style={styles.shareButton}
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        {/* Table of Contents */}
        {tocBlocks.length > 2 && (
          <AnimatedSection index={1}>
            <View style={styles.tocContainer}>
              <View style={styles.tocHeader}>
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.tocTitle}>In This Article</Text>
              </View>
              {tocBlocks.map((block, i) => {
                const text = block.text ?? '';
                const isActive = activeToc === text;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() => scrollToSection(text)}
                    style={[
                      styles.tocItem,
                      isActive && styles.tocItemActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.tocIndicator,
                        isActive && styles.tocIndicatorActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.tocText,
                        isActive && styles.tocTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedSection>
        )}

        {/* Content Blocks */}
        <View style={styles.contentContainer}>
          {post.content.map((block, index) =>
            renderContentBlock(block, index)
          )}
        </View>

        {/* Reactions Row */}
        <AnimatedSection index={tocBlocks.length}>
          <View style={styles.reactionsSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLiked(!liked)}
              style={[
                styles.reactionButton,
                liked && styles.reactionButtonActive,
              ]}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={22}
                color={liked ? colors.error : colors.textSecondary}
              />
              <Text
                style={[
                  styles.reactionLabel,
                  liked && styles.reactionLabelActive,
                ]}
              >
                Like
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                if (!isAuthenticated || !currentUserId || !post) return;
                const next = !bookmarked;
                setBookmarked(next);
                await toggleBlogBookmark(currentUserId, post.id);
                logBlogEvent('bookmark', post.id, currentUserId);
              }}
              style={[
                styles.reactionButton,
                bookmarked && styles.reactionButtonActive,
              ]}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.reactionLabel,
                  bookmarked && styles.reactionLabelActive,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              style={[
                styles.reactionButton,
                shared && styles.reactionButtonActive,
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={22}
                color={shared ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.reactionLabel,
                  shared && styles.reactionLabelActive,
                ]}
              >
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCommented(!commented)}
              style={[
                styles.reactionButton,
                commented && styles.reactionButtonActive,
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={commented ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.reactionLabel,
                  commented && styles.reactionLabelActive,
                ]}
              >
                Comment
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        {/* Comments Section */}
        <AnimatedSection index={tocBlocks.length + 2}>
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({commentCount})</Text>
            </View>

            {/* Comment Input */}
            {isAuthenticated ? (
              <View style={styles.commentInputWrap}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                  placeholderTextColor={colors.textTertiary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={1000}
                />
                {replyingTo && (
                  <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyCancelBtn}>
                    <Text style={styles.replyCancelText}>Cancel reply</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  style={[styles.commentSubmitBtn, (!commentText.trim() || submittingComment) && styles.commentSubmitBtnDisabled]}
                >
                  <Text style={styles.commentSubmitText}>{submittingComment ? '...' : 'Post'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push('/Login')} style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Sign in to comment</Text>
              </TouchableOpacity>
            )}

            {/* Comments List */}
            {comments.map((comment) => (
              <BlogCommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={(id) => { setReplyingTo(id); }}
                onLike={(id) => { likeBlogComment(id); }}
                onDelete={async (id) => {
                  await deleteBlogComment(id, currentUserId);
                  setComments((prev) => prev.filter((c) => c.id !== id));
                  setCommentCount((c) => Math.max(0, c - 1));
                }}
              />
            ))}
            {comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first to share your thoughts!</Text>
            )}
          </View>
        </AnimatedSection>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <AnimatedSection index={tocBlocks.length + 1}>
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Articles</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}
              >
                {relatedPosts.map((rPost, i) => (
                  <TouchableOpacity
                    key={rPost.id}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(`/BlogPost?slug=${rPost.slug}`)
                    }
                    style={styles.relatedCardWrap}
                  >
                    <GlassCard noPadding style={styles.relatedCard}>
                      <LinearGradient
                        colors={
                          GRADIENT_COVERS[i % GRADIENT_COVERS.length]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.relatedImage}
                      />
                      <View style={styles.relatedContent}>
                        <Text style={styles.relatedCardTitle} numberOfLines={2}>
                          {rPost.title}
                        </Text>
                        <View style={styles.relatedMeta}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={colors.textTertiary}
                          />
                          <Text style={styles.relatedReadingTime}>
                            {rPost.readingTime} min read
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </AnimatedSection>
        )}

        {/* CTA Section */}
        <AnimatedSection index={tocBlocks.length + 3}>
          <View style={styles.ctaContainer}>
            <GlassCard style={styles.ctaCard} noPadding>
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <View style={styles.ctaOverlay} />
                <View style={styles.ctaContent}>
                  <Ionicons name="compass" size={28} color={colors.primary} />
                  <Text style={styles.ctaHeading}>Explore HAMA</Text>
                  <Text style={styles.ctaDescription}>
                    Find properties, services, and marketplace items that match
                    this article
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/')}
                    style={styles.ctaButton}
                  >
                    <Text style={styles.ctaButtonText}>Start Exploring</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#000000"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </GlassCard>
          </View>
        </AnimatedSection>

        {/* Prev / Next */}
        <AnimatedSection index={tocBlocks.length + 4}>
          <View style={styles.prevNextSection}>
            {prevPost ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/BlogPost?slug=${prevPost.slug}`)}
                style={styles.prevNextWrap}
              >
                <GlassCard style={styles.prevNextCard}>
                  <View style={styles.prevNextLabel}>
                    <Ionicons
                      name="arrow-back"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.prevNextLabelText}>Previous</Text>
                  </View>
                  <Text style={styles.prevNextTitle} numberOfLines={2}>
                    {prevPost.title}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevNextWrap} />
            )}
            {nextPost ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/BlogPost?slug=${nextPost.slug}`)}
                style={styles.prevNextWrap}
              >
                <GlassCard style={styles.prevNextCard}>
                  <View style={[styles.prevNextLabel, styles.prevNextLabelRight]}>
                    <Text style={styles.prevNextLabelText}>Next</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text
                    style={[styles.prevNextTitle, styles.prevNextTitleRight]}
                    numberOfLines={2}
                  >
                    {nextPost.title}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevNextWrap} />
            )}
          </View>
        </AnimatedSection>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>Stay in the loop</Text>
            <Text style={styles.footerSubtitle}>
              Get the latest articles, guides, and housing tips delivered to your
              inbox.
            </Text>
            <View style={styles.footerEmailRow}>
              <TextInput
                style={styles.footerEmailInput}
                placeholder="Your email address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('Subscribed!', 'Thank you for subscribing to the HAMA newsletter.');
                }}
                style={styles.footerEmailBtn}
              >
                <Text style={styles.footerEmailBtnText}>Subscribe</Text>
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

        <View style={{ height: insets.bottom + SPACING.xl }} />
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

  /* Progress Bar */
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 100,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },

  /* Loading State */
  loadingContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loadingBar: {
    height: 3,
    backgroundColor: colors.bgCard,
    borderRadius: 1.5,
    marginBottom: SPACING.md,
  },
  loadingCover: {
    height: 240,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  loadingTitle: {
    height: 28,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.sm,
    width: '80%',
  },
  loadingTitleShort: {
    height: 28,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.sm,
    width: '50%',
  },
  loadingText: {
    height: 14,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    width: '100%',
    marginTop: SPACING.xs,
  },
  loadingTextShort: {
    height: 14,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    width: '60%',
    marginTop: SPACING.xs,
  },

  /* Not Found */
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  notFoundTitle: {
    ...FONTS.h2,
    color: colors.text,
  },
  notFoundText: {
    ...FONTS.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  notFoundBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  notFoundBtnText: {
    ...FONTS.button,
    color: '#000000',
  },

  /* Hero */
  heroContainer: {
    marginBottom: SPACING.md,
  },
  heroGradient: {
    minHeight: 380,
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTopBar: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    ...FONTS.caption,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    ...FONTS.title,
    color: colors.text,
    lineHeight: 38,
  },
  heroExcerpt: {
    ...FONTS.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  /* Author */
  authorSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitials: {
    ...FONTS.bodySmall,
    color: '#000000',
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  authorDate: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  authorDot: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  authorReadingTime: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* Table of Contents */
  tocContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tocTitle: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
  },
  tocItemActive: {
    backgroundColor: 'rgba(255,107,0,0.1)',
  },
  tocIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tocIndicatorActive: {
    backgroundColor: colors.primary,
    height: 16,
    borderRadius: 1,
  },
  tocText: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    flex: 1,
  },
  tocTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },

  /* Content Blocks */
  contentContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  heading2: {
    ...FONTS.h2,
    color: colors.text,
    marginTop: SPACING.sm,
  },
  heading3: {
    ...FONTS.h3,
    color: colors.text,
    marginTop: SPACING.xs,
  },
  paragraph: {
    ...FONTS.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  /* Image */
  imageContainer: {
    marginVertical: SPACING.xs,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCaption: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  /* List */
  listItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  listBullet: {
    ...FONTS.body,
    color: colors.primary,
    fontWeight: '600',
    width: 20,
  },
  listText: {
    ...FONTS.body,
    color: colors.textSecondary,
    lineHeight: 24,
    flex: 1,
  },

  /* Callout */
  calloutCard: {
    borderLeftWidth: 3,
    borderRadius: RADIUS.md,
  },
  calloutInner: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  calloutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutText: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },

  /* Quote */
  quoteContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.sm,
  },
  quoteBorder: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    marginRight: SPACING.md,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    ...FONTS.h3,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  quoteAuthor: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    marginTop: SPACING.sm,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },

  /* FAQ */
  faqSection: {
    gap: SPACING.sm,
  },
  faqSectionTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  faqItem: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  faqQuestion: {
    ...FONTS.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswer: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },

  /* Reactions */
  reactionsSection: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  reactionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderColor: 'rgba(255,107,0,0.3)',
  },
  reactionLabel: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  reactionLabelActive: {
    color: colors.primary,
  },

  /* Related Articles */
  relatedSection: {
    marginBottom: SPACING.lg,
  },
  relatedTitle: {
    ...FONTS.h3,
    color: colors.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  relatedScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  relatedCardWrap: {
    width: SCREEN_WIDTH * 0.72,
  },
  relatedCard: {
    overflow: 'hidden',
  },
  relatedImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  relatedContent: {
    padding: SPACING.sm,
  },
  relatedCardTitle: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedReadingTime: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },

  /* CTA */
  ctaContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  ctaCard: {
    overflow: 'hidden',
  },
  ctaGradient: {
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  ctaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: RADIUS.lg,
  },
  ctaContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  ctaHeading: {
    ...FONTS.h2,
    color: colors.text,
  },
  ctaDescription: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
  },
  ctaButtonText: {
    ...FONTS.button,
    color: '#000000',
  },

  /* Prev / Next */
  prevNextSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  prevNextWrap: {
    flex: 1,
  },
  prevNextCard: {
    minHeight: 90,
  },
  prevNextLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  prevNextLabelRight: {
    justifyContent: 'flex-end',
  },
  prevNextLabelText: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prevNextTitle: {
    ...FONTS.bodySmall,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  prevNextTitleRight: {
    textAlign: 'right',
  },

  /* Footer */
  footerContainer: {
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
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  footerEmailInput: {
    flex: 1,
    backgroundColor: colors.glassBorder,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: colors.text,
    fontSize: 14,
  },
  footerEmailBtn: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerEmailBtnText: {
    ...FONTS.button,
    color: '#000000',
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

  /* Comments */
  commentsSection: { marginTop: SPACING.xl, paddingHorizontal: SPACING.md },
  commentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  commentsTitle: { color: colors.text, fontSize: 18, fontWeight: '700' as const },
  commentInputWrap: { marginBottom: SPACING.md },
  commentInput: { backgroundColor: colors.glassBorder, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.glassBorder, padding: SPACING.md, color: colors.text, fontSize: 14, minHeight: 60, textAlignVertical: 'top' as const },
  commentSubmitBtn: { backgroundColor: colors.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, alignSelf: 'flex-end' as const, marginTop: SPACING.sm },
  commentSubmitBtnDisabled: { opacity: 0.5 },
  commentSubmitText: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
  replyCancelBtn: { paddingVertical: SPACING.xs },
  replyCancelText: { color: colors.primary, fontSize: 12, fontWeight: '500' as const },
  loginPrompt: { backgroundColor: colors.glassBorder, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.glassBorder, padding: SPACING.md, alignItems: 'center' as const, marginBottom: SPACING.md },
  loginPromptText: { color: colors.primary, fontSize: 14, fontWeight: '600' as const },
  noComments: { color: colors.textTertiary, fontSize: 14, textAlign: 'center' as const, paddingVertical: SPACING.xl },
});
