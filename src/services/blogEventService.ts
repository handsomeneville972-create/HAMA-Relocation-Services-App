/**
 * HAMA Blog Event Service
 *
 * Lightweight event logging for blog analytics.
 * write-heavy, fire-and-forget inserts + read-side aggregation.
 */

import { supabase } from '../utils/supabaseClient';
import type { BlogEventType } from '../constants/types';

// ---------- Write ----------

/**
 * Log a blog event (fire-and-forget — never blocks the UI).
 */
export async function logBlogEvent(
  type: BlogEventType,
  postId?: string,
  userId?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from('blog_events').insert({
      type,
      post_id: postId ?? null,
      user_id: userId ?? null,
      meta: meta ?? null,
    });
    if (error) {
      console.warn('[blogEvent] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[blogEvent] unexpected:', err);
  }
}

// ---------- Read ----------

interface PostAnalytics {
  postId: string;
  views: number;
  bookmarks: number;
  shares: number;
}

/**
 * Get top posts by view count (for admin analytics).
 * Falls back to an empty array on any error.
 */
export async function getBlogPostAnalytics(
  limit: number = 20,
): Promise<{ data: PostAnalytics[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('blog_events')
      .select('post_id, type')
      .not('post_id', 'is', null);

    if (error) {
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Aggregate in JS (Supabase lacks a native GROUP BY COUNT with pivots)
    const map = new Map<string, PostAnalytics>();

    for (const row of data as { post_id: string; type: BlogEventType }[]) {
      const id = row.post_id;
      if (!map.has(id)) {
        map.set(id, { postId: id, views: 0, bookmarks: 0, shares: 0 });
      }
      const agg = map.get(id)!;
      switch (row.type) {
        case 'view':
          agg.views += 1;
          break;
        case 'bookmark':
          agg.bookmarks += 1;
          break;
        case 'share':
          agg.shares += 1;
          break;
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return { data: result, error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}
