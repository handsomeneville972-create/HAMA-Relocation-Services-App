import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityPostCard } from '../src/components/CommunityPost';
import { getPostById, incrementPostViews, getComments, addComment, deleteComment } from '../src/services/communityService';
import { useAuth } from '../src/contexts/AuthContext';
import type { CommunityPost, PostComment } from '../src/constants/types';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../src/constants/theme';

const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function PostDetail() {
  const { postId } = useLocalSearchParams();
  const { currentUserId, currentUser } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const postIdRef = useRef(postId);

  useEffect(() => {
    postIdRef.current = postId;
  }, [postId]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      const { data } = await getPostById(postId as string, currentUserId);
      if (data) {
        setPost(data);
        setCommentCount(data.comments);
        incrementPostViews(data.id);
        setPost(prev => (prev ? { ...prev, views: prev.views + 1 } : prev));
      }
      setLoading(false);
    };
    const fetchComments = async () => {
      if (!postId) return;
      const { data } = await getComments(postId as string);
      if (data) setComments(data);
    };
    fetchPost();
    fetchComments();
  }, [postId, currentUserId]);

  const handleSendComment = async () => {
    const content = commentText.trim();
    if (!content || isSending || !postId || !currentUserId) return;
    setIsSending(true);

    const optimistic: PostComment = {
      id: `temp-${Date.now()}`,
      postId: postId as string,
      userId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    };

    setComments(prev => [optimistic, ...prev]);
    setCommentCount(prev => prev + 1);
    setCommentText('');

    const { data, error } = await addComment(postId as string, currentUserId, content);
    setIsSending(false);

    if (error || !data) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      setCommentCount(prev => Math.max(0, prev - 1));
    } else {
      setComments(prev => prev.map(c => (c.id === optimistic.id ? data : c)));
    }
  };

  const handleDeleteComment = async (comment: PostComment) => {
    if (comment.userId !== currentUserId) return;
    setComments(prev => prev.filter(c => c.id !== comment.id));
    setCommentCount(prev => Math.max(0, prev - 1));
    const { error } = await deleteComment(comment.id);
    if (error) {
      // Revert on failure
      const { data } = await getComments(postIdRef.current as string);
      setComments(data ?? []);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <CommunityPostCard post={post} />
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({commentCount})</Text>
          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No comments yet. Be the first to share your thoughts!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  {comment.user?.avatar ? (
                    <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatarImg} />
                  ) : (
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={14} color={COLORS.textTertiary} />
                    </View>
                  )}
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentUsername}>{comment.user?.name ?? 'User'}</Text>
                    <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
                  </View>
                  {comment.userId === currentUserId && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment)} style={styles.deleteButton}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputBar}>
        <LinearGradient colors={[COLORS.bgBlur, COLORS.bg]} style={styles.commentInputGradient}>
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!commentText.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="send" size={18} color={commentText.trim() ? COLORS.primary : COLORS.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  commentsSection: {
    padding: SPACING.md,
  },
  commentsTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  commentCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  commentText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  commentInputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInputGradient: {
    padding: SPACING.md,
    paddingBottom: 30,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  commentTextInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
