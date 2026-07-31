/**
 * HAMA Community Service
 *
 * Queries community posts, likes, bookmarks, comments, and tags
 * from Supabase. Falls back to mock data.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_COMMUNITY_POSTS } from '../constants/data';
import type { CommunityPost } from '../constants/types';

export async function getCommunityPosts(params?: {
  type?: string;
  userId?: string;
  limit?: number;
}): Promise<{ data: CommunityPost[] | null; error: string | null }> {
  return executeQuery<CommunityPost[]>(
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
      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      return { data: data as unknown as CommunityPost[] | null, error };
    },
    params?.userId
      ? MOCK_COMMUNITY_POSTS.filter(p => p.user.id === params.userId)
      : MOCK_COMMUNITY_POSTS,
  );
}

export async function getPostById(id: string): Promise<{ data: CommunityPost | null; error: string | null }> {
  return executeQuery<CommunityPost>(
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
      if (!error) {
        await supabase.rpc('increment_post_likes', { post_id: postId });
      }
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
