/**
 * HAMA Blog Reading History Service
 *
 * Tracks user reading history and generates personalised
 * recommendations based on what they've read.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_BLOG_POSTS, MOCK_BLOG_CATEGORIES } from '../constants/blogMockData';
import type { BlogPost, BlogCategory } from '../constants/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadingHistoryRow {
  post_id: string;
  created_at: string;
}

interface CategoryCountRow {
  category_id: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a raw Supabase row to a BlogPost using mock data as the source of truth. */
function rowToPost(row: { post_id: string; created_at?: string }): BlogPost | undefined {
  return MOCK_BLOG_POSTS.find(p => p.id === row.post_id);
}

/** Attach full category / author relations from mock data. */
function attachRelations(post: BlogPost): BlogPost {
  const cat = MOCK_BLOG_CATEGORIES.find(c => c.id === post.categoryId);
  return {
    ...post,
    category: cat
      ? { id: cat.id, slug: cat.slug, name: cat.name, description: cat.description ?? '', icon: cat.icon, position: cat.position }
      : post.category,
  };
}

// ---------------------------------------------------------------------------
// getReadingHistory
// ---------------------------------------------------------------------------

export async function getReadingHistory(
  userId: string,
  limit?: number,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const result = await executeQuery<BlogPost[]>(
    async () => {
      const { data, error } = await supabase
        .from('blog_events')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .in('type', ['view', 'read_complete'])
        .order('created_at', { ascending: false });

      if (error) return { data: null, error };

      const seen = new Set<string>();
      const posts: BlogPost[] = [];

      for (const row of (data ?? []) as ReadingHistoryRow[]) {
        if (seen.has(row.post_id)) continue;
        seen.add(row.post_id);
        const post = rowToPost(row);
        if (post) posts.push(post);
        if (posts.length >= (limit ?? 10)) break;
      }

      return { data: posts, error: null };
    },
    [],
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

// ---------------------------------------------------------------------------
// getUserTopCategories
// ---------------------------------------------------------------------------

export async function getUserTopCategories(
  userId: string,
  limit?: number,
): Promise<{ data: { category: BlogCategory; count: number }[] | null; error: string | null }> {
  const result = await executeQuery<{ category: BlogCategory; count: number }[]>(
    async () => {
      const { data: events, error: evErr } = await supabase
        .from('blog_events')
        .select('post_id')
        .eq('user_id', userId)
        .eq('type', 'read_complete');

      if (evErr) return { data: null, error: evErr };
      if (!events || events.length === 0) return { data: [], error: null };

      // Resolve category_id for each post via mock data
      const catCount = new Map<string, number>();
      for (const ev of events) {
        const post = MOCK_BLOG_POSTS.find(p => p.id === ev.post_id);
        if (!post?.categoryId) continue;
        catCount.set(post.categoryId, (catCount.get(post.categoryId) ?? 0) + 1);
      }

      // Sort descending by count
      const sorted = [...catCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit ?? 5);

      const result: { category: BlogCategory; count: number }[] = [];
      for (const [catId, count] of sorted) {
        const cat = MOCK_BLOG_CATEGORIES.find(c => c.id === catId);
        if (cat) result.push({ category: cat, count });
      }

      return { data: result, error: null };
    },
    [],
  );

  return result;
}

// ---------------------------------------------------------------------------
// getRecommendedPosts
// ---------------------------------------------------------------------------

export async function getRecommendedPosts(
  userId: string,
  excludePostIds?: string[],
  limit?: number,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const topCats = await getUserTopCategories(userId, 5);
  const catIds = (topCats.data ?? []).map(tc => tc.category.id);

  const result = await executeQuery<BlogPost[]>(
    async () => {
      if (catIds.length === 0) {
        // No reading history — fall back to featured posts
        let query = supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('featured', true)
          .order('published_at', { ascending: false });

        if (excludePostIds && excludePostIds.length > 0) {
          query = query.not('id', 'in', `(${excludePostIds.join(',')})`);
        }

        query = query.limit(limit ?? 6);
        const { data, error } = await query;
        return { data: data as unknown as BlogPost[] | null, error };
      }

      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .in('category_id', catIds)
        .order('published_at', { ascending: false });

      if (excludePostIds && excludePostIds.length > 0) {
        query = query.not('id', 'in', `(${excludePostIds.join(',')})`);
      }

      query = query.limit(limit ?? 6);
      const { data, error } = await query;
      return { data: data as unknown as BlogPost[] | null, error };
    },
    // Mock fallback: featured posts
    (() => {
      let fallback = MOCK_BLOG_POSTS.filter(p => p.status === 'published' && p.featured);
      if (excludePostIds && excludePostIds.length > 0) {
        fallback = fallback.filter(p => !excludePostIds.includes(p.id));
      }
      return fallback.slice(0, limit ?? 6);
    })(),
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

// ---------------------------------------------------------------------------
// getContinueReading
// ---------------------------------------------------------------------------

export async function getContinueReading(
  userId: string,
  limit?: number,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const result = await executeQuery<BlogPost[]>(
    async () => {
      // Posts the user started reading (view) but never finished (read_complete)
      const { data: viewed, error: viewErr } = await supabase
        .from('blog_events')
        .select('post_id')
        .eq('user_id', userId)
        .eq('type', 'view');

      if (viewErr) return { data: null, error: viewErr };
      if (!viewed || viewed.length === 0) return { data: [], error: null };

      const { data: completed, error: compErr } = await supabase
        .from('blog_events')
        .select('post_id')
        .eq('user_id', userId)
        .eq('type', 'read_complete');

      if (compErr) return { data: null, error: compErr };

      const completedIds = new Set((completed ?? []).map(c => c.post_id));

      const seen = new Set<string>();
      const posts: BlogPost[] = [];

      for (const row of viewed) {
        if (completedIds.has(row.post_id)) continue;
        if (seen.has(row.post_id)) continue;
        seen.add(row.post_id);
        const post = rowToPost(row);
        if (post) posts.push(post);
        if (posts.length >= (limit ?? 3)) break;
      }

      return { data: posts, error: null };
    },
    [],
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

// ---------------------------------------------------------------------------
// trackReadingSession
// ---------------------------------------------------------------------------

export async function trackReadingSession(
  userId: string,
  postId: string,
): Promise<void> {
  supabase
    .from('blog_events')
    .insert({ type: 'view', user_id: userId, post_id: postId })
    .then(({ error }) => {
      if (error) console.warn('[BlogHistory] Failed to track reading session:', error.message);
    });
}
