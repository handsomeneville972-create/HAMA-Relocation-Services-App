import { supabase } from '../utils/supabaseClient';
import type { BlogComment } from '../constants/types';

export async function getBlogComments(
  postId: string,
): Promise<{ data: BlogComment[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*, profiles:user_id(name, avatar)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    const flat: BlogComment[] = (data ?? []).map((c: any) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      parentId: c.parent_id ?? undefined,
      content: c.content,
      status: c.status,
      likes: c.likes ?? 0,
      pinned: c.pinned ?? false,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      authorName: c.profiles?.name ?? 'Anonymous',
      authorAvatar: c.profiles?.avatar ?? undefined,
      replies: [],
    }));

    const byId: Record<string, BlogComment> = {};
    flat.forEach((c) => { byId[c.id] = c; });

    const topLevel: BlogComment[] = [];
    flat.forEach((c) => {
      if (c.parentId && byId[c.parentId]) {
        byId[c.parentId].replies!.push(c);
      } else {
        topLevel.push(c);
      }
    });

    return { data: topLevel, error: null };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

export async function createBlogComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<{ data: BlogComment | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId ?? null,
        status: 'pending',
      })
      .select('*, profiles:user_id(name, avatar)')
      .single();

    if (error) throw error;

    const comment: BlogComment = {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      parentId: data.parent_id ?? undefined,
      content: data.content,
      status: data.status,
      likes: data.likes ?? 0,
      pinned: data.pinned ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      authorName: data.profiles?.name ?? 'You',
      authorAvatar: data.profiles?.avatar ?? undefined,
      replies: [],
    };
    return { data: comment, error: null };
  } catch (e: any) {
    const fallback: BlogComment = {
      id: `local-${Date.now()}`,
      postId,
      userId,
      parentId,
      content,
      status: 'pending',
      likes: 0,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: 'You',
      replies: [],
    };
    return { data: fallback, error: null };
  }
}

export async function deleteBlogComment(
  commentId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function likeBlogComment(commentId: string): Promise<void> {
  try {
    await supabase.rpc('increment_comment_likes', { comment_id: commentId });
  } catch {
    // fire-and-forget
  }
}

export async function getBlogCommentCount(
  postId: string,
): Promise<{ data: number | null; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('blog_comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'approved');
    if (error) throw error;
    return { data: count, error: null };
  } catch (e: any) {
    return { data: 0, error: e.message };
  }
}
