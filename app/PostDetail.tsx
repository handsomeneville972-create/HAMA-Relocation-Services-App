import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityPostCard } from '../src/components/CommunityPost';
import { getPostById, incrementPostViews } from '../src/services/communityService';
import type { CommunityPost } from '../src/constants/types';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../src/constants/theme';

export default function PostDetail() {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      const { data } = await getPostById(postId as string);
      if (data) {
        setPost(data);
        incrementPostViews(data.id);
        setPost(prev => (prev ? { ...prev, views: prev.views + 1 } : prev));
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

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
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <CommunityPostCard post={post} />
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({post.comments})</Text>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {['👤', '👩', '👨'][i - 1]}
                  </Text>
                </View>
                <View style={styles.commentInfo}>
                  <Text style={styles.commentUsername}>
                    {['Sarah K.', 'Peter M.', 'Grace W.'][i - 1]}
                  </Text>
                  <Text style={styles.commentTime}>2h ago</Text>
                </View>
              </View>
              <Text style={styles.commentText}>
                {[
                  'This is so helpful! Thanks for sharing your experience.',
                  'Great tips! I wish I knew this before moving.',
                  'Love the neighborhood guide. Can you do one for Kilimani?',
                ][i - 1]}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputBar}>
        <LinearGradient colors={[COLORS.bgBlur, COLORS.bg]} style={styles.commentInputGradient}>
          <View style={styles.commentInput}>
            <Text style={styles.commentInputPlaceholder}>Write a comment...</Text>
            <TouchableOpacity style={styles.sendButton}>
              <Ionicons name="send" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
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
  commentAvatarText: {
    fontSize: 16,
  },
  commentInfo: {},
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
  commentInputPlaceholder: {
    flex: 1,
    color: COLORS.textTertiary,
    fontSize: 14,
    paddingVertical: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
