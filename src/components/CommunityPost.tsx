import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityPost as CommunityPostType } from '../constants/types';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { likePost, unlikePost, bookmarkPost, unbookmarkPost, incrementPostShares } from '../services/communityService';

interface CommunityPostCardProps {
  post: CommunityPostType;
  onPress?: () => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onPress }) => {
  const { currentUserId } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarks);
  const [shareCount, setShareCount] = useState(post.shares);

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
        <LinearGradient colors={COLORS.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{post.user.name}</Text>
              <Text style={styles.time}>{post.createdAt}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textSecondary} />
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
          {post.image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            </View>
          )}

          {post.video && (
            <View style={styles.videoContainer}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600' }} style={styles.postImage} resizeMode="cover" />
              <View style={styles.playButton}>
                <Ionicons name="play" size={28} color="#fff" />
              </View>
            </View>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <Ionicons name="eye-outline" size={20} color={COLORS.textTertiary} />
                <Text style={styles.actionText}>{post.views}</Text>
              </View>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? COLORS.secondary : COLORS.textSecondary}
                  />
                </Animated.View>
                <Text style={[styles.actionText, liked && styles.likedText]}>{likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={21} color={COLORS.textSecondary} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Ionicons name="arrow-redo-outline" size={21} color={COLORS.textSecondary} />
                <Text style={styles.actionText}>{shareCount}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={bookmarked ? COLORS.primary : COLORS.textSecondary}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    color: COLORS.text,
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
    color: COLORS.primaryLight,
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
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
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
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  likedText: {
    color: COLORS.secondary,
  },
});
