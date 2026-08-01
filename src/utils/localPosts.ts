/**
 * HAMA Local Posts Store
 *
 * In-memory store for posts published from the upload screen before they
 * reach the backend. CommunityScreen prepends these to the feed so a
 * creator can immediately see what they just published.
 */

import type { CommunityPost } from '../constants/types';

let localPosts: CommunityPost[] = [];

/** Register a newly published post (prepended to the local feed). */
export function publishLocalPost(post: CommunityPost): void {
  localPosts = [post, ...localPosts.filter((p) => p.id !== post.id)].slice(0, 20);
}

/** Get all locally published posts, newest first. */
export function getLocalPosts(): CommunityPost[] {
  return localPosts;
}

/** Clear the local store (e.g. on sign out). */
export function clearLocalPosts(): void {
  localPosts = [];
}
