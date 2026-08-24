import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import type { BlogComment } from '../constants/types';

interface BlogCommentProps {
  comment: BlogComment;
  currentUserId?: string;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const MAX_DEPTH = 3;

export const BlogCommentCard: React.FC<BlogCommentProps> = ({
  comment,
  currentUserId,
  onReply,
  onLike,
  onDelete,
  depth = 0,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reducedMotion = useReducedMotion();

  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reducedMotion ? 0 : 16)).current;

  useEffect(() => {
    if (!reducedMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const isOwner = comment.userId === currentUserId;
  const authorName = comment.authorName ?? 'Anonymous';
  const canNest = depth < MAX_DEPTH;
  const marginLeft = depth > 0 ? SPACING.md + depth * SPACING.lg : 0;

  const handleLike = () => onLike?.(comment.id);
  const handleReply = () => onReply?.(comment.id);
  const handleDelete = () => onDelete?.(comment.id);

  const renderAvatar = () => {
    if (comment.authorAvatar) {
      return (
        <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
      );
    }
    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Text style={styles.avatarText}>{getInitials(authorName)}</Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginLeft,
      }}
    >
      <View style={[styles.card, depth > 0 && styles.nestedCard]}>
        <View style={styles.header}>
          {renderAvatar()}
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              {comment.pinned && (
                <View style={[styles.badge, styles.pinnedBadge]}>
                  <Ionicons name="pin" size={10} color={colors.primary} />
                  <Text style={styles.pinnedBadgeText}>
                    Pinned
                  </Text>
                </View>
              )}
              {comment.status === 'pending' && (
                <View style={[styles.badge, styles.pendingBadge]}>
                  <Text style={styles.pendingBadgeText}>
                    Pending
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>
              {getRelativeTime(comment.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={styles.content}>{comment.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.actionText}>{comment.likes}</Text>
          </TouchableOpacity>

          {canNest && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleReply}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {comment.replies?.map((reply) => (
        <BlogCommentCard
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          onReply={onReply}
          onLike={onLike}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.glassBorder,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: SPACING.md,
      marginTop: SPACING.sm,
    },
    nestedCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarFallback: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...FONTS.caption,
      fontWeight: '700',
      color: colors.textInverse,
    },
    headerText: {
      flex: 1,
      marginLeft: SPACING.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    authorName: {
      ...FONTS.bodySmall,
      fontWeight: '600',
      color: colors.text,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
      gap: 3,
    },
    pinnedBadge: {
      backgroundColor: 'rgba(255, 107, 0, 0.15)',
    },
    pinnedBadgeText: {
      ...FONTS.caption,
      fontSize: 10,
      color: colors.primary,
    },
    pendingBadge: {
      backgroundColor: 'rgba(255, 184, 77, 0.18)',
    },
    pendingBadgeText: {
      ...FONTS.caption,
      fontSize: 10,
      color: colors.warning,
    },
    timeText: {
      ...FONTS.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
    content: {
      ...FONTS.body,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      ...FONTS.caption,
      color: colors.textTertiary,
    },
  });
