import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CommunityPost as CommunityPostType } from '../constants/types';
import { UserAvatar } from './UserAvatar';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { likePost, unlikePost, bookmarkPost, unbookmarkPost, incrementPostShares } from '../services/communityService';

interface CommunityPostCardProps {
  post: CommunityPostType;
  onPress?: () => void;
}

const VideoMedia: React.FC<{ uri: string; style?: StyleProp<ViewStyle>; active: boolean; onPlayToggle: () => void }> = ({ uri, style, active, onPlayToggle }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = false;
  });
  useEffect(() => {
    if (active && !player.playing) {
      player.play();
    } else if (!active && player.playing) {
      player.pause();
    }
  }, [active, player]);
  return (
    <TouchableOpacity style={style} activeOpacity={1} onPress={onPlayToggle}>
      <VideoView player={player} style={StyleSheet.absoluteFillObject} contentFit="cover" nativeControls={false} />
      {!active && (
        <View style={mediaStyles.playOverlaySmall}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const MediaGrid: React.FC<{ images: string[]; videos: string[] }> = ({ images, videos }) => {
  const items = [
    ...images.map(uri => ({ uri, type: 'image' as const })),
    ...videos.map(uri => ({ uri, type: 'video' as const })),
  ];
  const [activeVideoUri, setActiveVideoUri] = useState<string | null>(isVideoOnly(items) ? items[0].uri : null);
  const togglePlay = (uri: string) => {
    setActiveVideoUri(prev => (prev === uri ? null : uri));
  };
  if (items.length === 0) return null;
  if (items.length === 1) {
    const item = items[0];
    if (item.type === 'video') {
      return (
        <VideoMedia
          uri={item.uri}
          style={mediaStyles.videoContainer}
          active={activeVideoUri === item.uri}
          onPlayToggle={() => togglePlay(item.uri)}
        />
      );
    }
    return (
      <View style={mediaStyles.imageContainer}>
        <Image source={{ uri: item.uri }} style={mediaStyles.singleThumbnail} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={mediaStyles.gridRow}>
      {items.map((item, idx) =>
        item.type === 'video' ? (
          <VideoMedia
            key={`${item.uri}-${idx}`}
            uri={item.uri}
            style={mediaStyles.gridCell}
            active={activeVideoUri === item.uri}
            onPlayToggle={() => togglePlay(item.uri)}
          />
        ) : (
          <View key={`${item.uri}-${idx}`} style={mediaStyles.gridCell}>
            <Image source={{ uri: item.uri }} style={mediaStyles.gridThumbnail} resizeMode="cover" />
          </View>
        ),
      )}
    </View>
  );
};

const isVideoOnly = (items: { type: string }[]) => items.length === 1 && items[0].type === 'video';

const mediaStyles = StyleSheet.create({
  imageContainer: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.sm },
  videoContainer: { position: 'relative', width: '100%', height: 200, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.sm },
  singleThumbnail: { width: '100%', height: 200 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  gridCell: { width: '48%', aspectRatio: 1, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  gridThumbnail: { width: '100%', height: '100%' },
  playOverlaySmall: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -16 }, { translateY: -16 }], width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
});

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentUserId } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarks);
  const [shareCount, setShareCount] = useState(post.shares);
  const [legacyVideoPlaying, setLegacyVideoPlaying] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const particles = useRef(new Animated.Value(0)).current;

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(prev => Math.max(0, prev + (nextLiked ? 1 : -1)));

    if (nextLiked) {
      // Heart burst animation
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.4, damping: 10, stiffness: 200, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
      ]).start();
      // Particles
      Animated.sequence([
        Animated.timing(particles, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(particles, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }

    if (!currentUserId) return;

    const result = nextLiked
      ? await likePost(post.id, currentUserId)
      : await unlikePost(post.id, currentUserId);

    if (result.error) {
      // Revert on failure
      setLiked(!nextLiked);
      setLikeCount(prev => Math.max(0, prev + (nextLiked ? -1 : 1)));
    }
  };

  const handleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setBookmarkCount(prev => Math.max(0, prev + (nextBookmarked ? 1 : -1)));

    if (nextBookmarked) {
      Animated.sequence([
        Animated.spring(bookmarkScale, { toValue: 1.3, damping: 10, stiffness: 200, useNativeDriver: true }),
        Animated.spring(bookmarkScale, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
      ]).start();
    }

    if (!currentUserId) return;

    const result = nextBookmarked
      ? await bookmarkPost(post.id, currentUserId)
      : await unbookmarkPost(post.id, currentUserId);

    if (result.error) {
      setBookmarked(!nextBookmarked);
      setBookmarkCount(prev => Math.max(0, prev + (nextBookmarked ? -1 : 1)));
    }
  };

  const handleShare = async () => {
    setShareCount(prev => prev + 1);
    if (currentUserId) {
      await incrementPostShares(post.id);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
      <View style={styles.card}>
        <LinearGradient colors={colors.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <UserAvatar uri={post.user.avatar} size={40} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{post.user.name}</Text>
              <Text style={styles.time}>{post.createdAt}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={styles.content}>{post.content}</Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Media */}
          {post.media && post.media.length > 0 ? (
            <MediaGrid
              images={post.media.filter(m => m.mediaType === 'image').map(m => m.mediaUrl)}
              videos={post.media.filter(m => m.mediaType === 'video').map(m => m.mediaUrl)}
            />
          ) : (
            <>
              {post.image && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                </View>
              )}

              {post.video && (
                <VideoMedia
                  uri={post.video}
                  style={styles.videoContainer}
                  active={legacyVideoPlaying}
                  onPlayToggle={() => setLegacyVideoPlaying(prev => !prev)}
                />
              )}
            </>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <Ionicons name="eye-outline" size={20} color={colors.textTertiary} />
                <Text style={styles.actionText}>{post.views}</Text>
              </View>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? colors.secondary : colors.textSecondary}
                  />
                </Animated.View>
                <Text style={[styles.actionText, liked && styles.likedText]}>{likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={21} color={colors.textSecondary} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Ionicons name="arrow-redo-outline" size={21} color={colors.textSecondary} />
                <Text style={styles.actionText}>{shareCount}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={bookmarked ? colors.primary : colors.textSecondary}
                />
              </Animated.View>
              <Text style={[styles.actionText, bookmarked && styles.bookmarkedText]}>{bookmarkCount}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '500',
  },
  imageContainer: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: SPACING.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  likedText: {
    color: colors.secondary,
  },
  bookmarkedText: {
    color: colors.primary,
  },
});
