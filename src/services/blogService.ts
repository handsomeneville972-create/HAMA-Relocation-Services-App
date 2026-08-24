/**
 * HAMA Blog Service
 *
 * Queries blog posts, categories, authors, and bookmarks
 * from Supabase. Falls back to mock data.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, DEFAULT_PAGE_SIZE } from './supabaseService';
import { MOCK_BLOG_POSTS, MOCK_BLOG_CATEGORIES, MOCK_BLOG_AUTHORS } from '../constants/blogMockData';
import type { BlogPost, BlogCategory, BlogAuthor } from '../constants/types';

const SELECT_POST = '*, category:blog_categories(*), author:blog_authors(*)';

function attachRelations(post: BlogPost): BlogPost {
  const cat = MOCK_BLOG_CATEGORIES.find(c => c.id === post.categoryId);
  const auth = MOCK_BLOG_AUTHORS.find(a => a.id === post.authorId);
  return {
    ...post,
    category: cat ? { id: cat.id, slug: cat.slug, name: cat.name, description: '', icon: cat.icon, position: 0 } : post.category,
    author: auth ? { id: auth.id, userId: '', name: auth.name, slug: auth.slug, avatarUrl: auth.avatarUrl, bio: auth.bio } : post.author,
  };
}

export async function getBlogPosts(params?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const result = await executeQuery<BlogPost[]>(
    async () => {
      let query = supabase
        .from('blog_posts')
        .select(SELECT_POST)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (params?.categorySlug) {
        const { data: cat } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', params.categorySlug)
          .maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (params?.featured !== undefined) {
        query = query.eq('featured', params.featured);
      }
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`);
      }

      const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
      query = query.limit(limit);

      const { data, error } = await query;
      return { data: data as unknown as BlogPost[] | null, error };
    },
    filterMockPosts(MOCK_BLOG_POSTS, params),
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<{ data: BlogPost | null; error: string | null }> {
  const result = await executeQuery<BlogPost>(
    async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(SELECT_POST)
        .eq('slug', slug)
        .single();
      return { data: data as unknown as BlogPost | null, error };
    },
    MOCK_BLOG_POSTS.find(p => p.slug === slug) ?? undefined,
  );

  if (result.data) {
    result.data = attachRelations(result.data);
  }
  return result;
}

export async function getBlogCategories(): Promise<{ data: BlogCategory[] | null; error: string | null }> {
  return executeQuery<BlogCategory[]>(
    async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('position', { ascending: true });
      return {
        data: (data ?? []).map(c => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description ?? '',
          icon: c.icon,
          position: c.position ?? 0,
        })) as BlogCategory[] | null,
        error,
      };
    },
    MOCK_BLOG_CATEGORIES.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: '',
      icon: c.icon,
      position: 0,
    })),
  );
}

export async function getBlogAuthors(): Promise<{ data: BlogAuthor[] | null; error: string | null }> {
  return executeQuery<BlogAuthor[]>(
    async () => {
      const { data, error } = await supabase
        .from('blog_authors')
        .select('*')
        .order('name', { ascending: true });
      return {
        data: (data ?? []).map(a => ({
          id: a.id,
          userId: a.user_id ?? '',
          name: a.name,
          slug: a.slug,
      avatarUrl: a.avatarUrl ?? undefined,
          bio: a.bio ?? '',
        })) as BlogAuthor[] | null,
        error,
      };
    },
    MOCK_BLOG_AUTHORS.map(a => ({
      id: a.id,
      userId: '',
      name: a.name,
      slug: a.slug,
      avatarUrl: a.avatarUrl ?? undefined,
      bio: a.bio,
    })),
  );
}

export async function getBlogPostsByCategory(
  categorySlug: string,
  limit?: number,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  return getBlogPosts({ categorySlug, limit });
}

export async function getBlogPostsByAuthor(
  authorSlug: string,
  limit?: number,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const result = await executeQuery<BlogPost[]>(
    async () => {
      const { data: author } = await supabase
        .from('blog_authors')
        .select('id')
        .eq('slug', authorSlug)
        .maybeSingle();

      if (!author) return { data: [], error: null };

      let query = supabase
        .from('blog_posts')
        .select(SELECT_POST)
        .eq('status', 'published')
        .eq('author_id', author.id)
        .order('published_at', { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      return { data: data as unknown as BlogPost[] | null, error };
    },
    (() => {
      const author = MOCK_BLOG_AUTHORS.find(a => a.slug === authorSlug);
      if (!author) return [];
      return MOCK_BLOG_POSTS.filter(p => p.authorId === author.id).slice(0, limit ?? MOCK_BLOG_POSTS.length);
    })(),
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

export async function getRelatedBlogPosts(
  post: BlogPost,
  limit: number = 3,
): Promise<{ data: BlogPost[] | null; error: string | null }> {
  const result = await executeQuery<BlogPost[]>(
    async () => {
      let query = supabase
        .from('blog_posts')
        .select(SELECT_POST)
        .eq('status', 'published')
        .neq('id', post.id)
        .or(
          `category_id.eq.${post.categoryId ?? ''},tags.cs.{${(post.tags ?? []).join(',')}}`,
        )
        .order('published_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      return { data: data as unknown as BlogPost[] | null, error };
    },
    MOCK_BLOG_POSTS.filter(p => p.id !== post.id && p.categoryId === post.categoryId).slice(0, limit),
  );

  if (result.data) {
    result.data = result.data.map(attachRelations);
  }
  return result;
}

export async function incrementBlogViews(postId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_blog_views', { p_post_id: postId });
  if (error) {
    console.warn('[Supabase] Failed to increment blog views:', error.message);
  }
}

export async function toggleBlogBookmark(
  userId: string,
  postId: string,
): Promise<{ data: boolean | null; error: string | null }> {
  const result = await executeQuery<boolean>(
    async () => {
      const { data: existing } = await supabase
        .from('blog_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('blog_bookmarks')
          .delete()
          .eq('id', existing.id);
        return { data: false, error };
      }

      const { error } = await supabase
        .from('blog_bookmarks')
        .insert({ user_id: userId, post_id: postId });
      return { data: true, error };
    },
  );
  return { data: result.data ?? null, error: result.error };
}

export async function isBlogBookmarked(
  userId: string,
  postId: string,
): Promise<{ data: boolean | null; error: string | null }> {
  const result = await executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('blog_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();
      return { data: !!data, error };
    },
    false,
  );
  return { data: !!result.data, error: result.error };
}

// ---------- Internal Helpers ----------

function filterMockPosts(
  posts: typeof MOCK_BLOG_POSTS,
  params?: { categorySlug?: string; featured?: boolean; limit?: number; search?: string },
): typeof MOCK_BLOG_POSTS {
  let filtered = [...posts];

  if (params?.categorySlug) {
    const cat = MOCK_BLOG_CATEGORIES.find(c => c.slug === params.categorySlug);
    if (cat) filtered = filtered.filter(p => p.categoryId === cat.id);
  }
  if (params?.featured !== undefined) {
    filtered = filtered.filter(p => p.featured === params.featured);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      p => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q),
    );
  }

  return filtered.slice(0, params?.limit ?? DEFAULT_PAGE_SIZE);
}
