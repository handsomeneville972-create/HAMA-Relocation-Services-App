/**
 * HAMA Community Service
 *
 * Queries community posts, likes, bookmarks, comments, and tags
 * from Supabase. Falls back to mock data.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, DEFAULT_PAGE_SIZE, SEARCH_PAGE_SIZE } from './supabaseService';
import { MOCK_COMMUNITY_POSTS } from '../constants/data';
import type { CommunityPost, PostComment } from '../constants/types';

export async function getCommunityPosts(params?: {
  type?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}): Promise<{ data: CommunityPost[] | null; error: string | null }> {
  const postsResult = await executeQuery<CommunityPost[]>(
    async () => {
      let query = supabase
        .from('community_posts')
        .select('*, user:user_id(*), tags:community_post_tags(*)')
        .order('created_at', { ascending: false });

      if (params?.type) {
        query = query.eq('type', params.type);
      }
      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
      const offset = params?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      return { data: data as unknown as CommunityPost[] | null, error };
    },
    params?.userId
      ? MOCK_COMMUNITY_POSTS.filter(p => p.user.id === params.userId)
      : MOCK_COMMUNITY_POSTS,
  );

  // Attach real like/bookmark state for the current user
  if (params?.currentUserId && postsResult.data) {
    const [likes, bookmarks] = await Promise.all([
      supabase.from('community_post_likes').select('post_id').eq('user_id', params.currentUserId),
      supabase.from('community_post_bookmarks').select('post_id').eq('user_id', params.currentUserId),
    ]);
    const likedIds = new Set((likes.data ?? []).map(r => r.post_id));
    const bookmarkedIds = new Set((bookmarks.data ?? []).map(r => r.post_id));
    return {
      ...postsResult,
      data: postsResult.data.map(p => ({
        ...p,
        isLiked: likedIds.has(p.id),
        isBookmarked: bookmarkedIds.has(p.id),
      })),
    };
  }

  return postsResult;
}

export async function getPostById(
  id: string,
  currentUserId?: string,
): Promise<{ data: CommunityPost | null; error: string | null }> {
  const result = await executeQuery<CommunityPost>(
    async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, user:user_id(*), tags:community_post_tags(*)')
        .eq('id', id)
        .single();
      return { data: data as unknown as CommunityPost | null, error };
    },
    MOCK_COMMUNITY_POSTS.find(p => p.id === id) ?? MOCK_COMMUNITY_POSTS[0],
  );

  if (result.data && currentUserId) {
    const [liked, bookmarked] = await Promise.all([
      isPostLiked(id, currentUserId),
      isPostBookmarked(id, currentUserId),
    ]);
    return {
      ...result,
      data: {
        ...result.data,
        isLiked: !!liked.data,
        isBookmarked: !!bookmarked.data,
      },
    };
  }

  return result;
}

export async function incrementPostViews(
  postId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('increment_post_views', { post_id: postId });
  if (error) {
    console.warn('[Supabase] Failed to increment post views:', error.message);
  }
  return { error: error?.message ?? null };
}

export async function createPost(post: {
  userId: string;
  type: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  tags?: string[];
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: post.userId,
          type: post.type,
          content: post.content,
          image_url: post.imageUrl ?? null,
          video_url: post.videoUrl ?? null,
        })
        .select()
        .single();
      if (!error && data && post.tags && post.tags.length > 0) {
        await supabase.from('community_post_tags').insert(
          post.tags.map(tag => ({ post_id: data.id, tag })),
        );
      }
      return { data, error };
    },
    null,
  );
}

export async function likePost(
  postId: string,
  userId: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('community_post_likes')
        .insert({ post_id: postId, user_id: userId })
        .select()
        .single();
      return { data, error };
    },
    null,
  );
}

export async function unlikePost(
  postId: string,
  userId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      return { data: null, error };
    },
    null,
  );
}

export async function isPostLiked(
  postId: string,
  userId: string,
): Promise<{ data: boolean; error: string | null }> {
  const result = await executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      return { data: !!data, error };
    },
    false,
  );
  return { data: !!result.data, error: result.error };
}

export async function isPostBookmarked(
  postId: string,
  userId: string,
): Promise<{ data: boolean; error: string | null }> {
  const result = await executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('community_post_bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      return { data: !!data, error };
    },
    false,
  );
  return { data: !!result.data, error: result.error };
}

export async function bookmarkPost(
  postId: string,
  userId: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('community_post_bookmarks')
        .insert({ post_id: postId, user_id: userId })
        .select()
        .single();
      return { data, error };
    },
    null,
  );
}

export async function unbookmarkPost(
  postId: string,
  userId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('community_post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      return { data: null, error };
    },
    null,
  );
}

export async function incrementPostShares(
  postId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('increment_post_shares', { p_post_id: postId });
  if (error) {
    console.warn('[Supabase] Failed to increment post shares:', error.message);
  }
  return { error: error?.message ?? null };
}

// ---------- Comments ----------

export async function getComments(
  postId: string,
): Promise<{ data: PostComment[] | null; error: string | null }> {
  return executeQuery<PostComment[]>(
    async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, user:user_id(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as unknown as PostComment[] | null, error };
    },
    [],
  );
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
): Promise<{ data: PostComment | null; error: string | null }> {
  return executeQuery<PostComment | null>(
    async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select('*, user:user_id(*)')
        .single();
      return { data: data as unknown as PostComment | null, error };
    },
    null,
  );
}

export async function deleteComment(
  commentId: string,
): Promise<{ error: string | null }> {
  return executeQuery<null>(
    async () => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      return { data: null, error };
    },
    null,
  );
}
