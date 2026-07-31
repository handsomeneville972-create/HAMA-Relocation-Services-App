/**
 * HAMA Data Transformation Utilities
 *
 * Converts snake_case database rows to camelCase TypeScript types.
 * This is the transformation layer that bridges the gap between
 * Supabase's snake_case column naming and the app's camelCase types.
 *
 * Usage:
 *   import { toCamelCase } from '../utils/transform';
 *   const camelCaseData = toCamelCase(snakeCaseRow);
 *
 * The transformation is applied automatically in the base service layer
 * (supabaseService.ts → executeQuery), so most callers never need to
 * call these functions directly.
 */

// ====================================================================
// FIELD RENAME MAP
//
// Maps DB snake_case column names → TypeScript field names for cases
// where a simple snake-to-camel conversion (e.g., `logo_url` → `logoUrl`)
// would produce the wrong field name (e.g., the type expects `logo`).
//
// Only entries that DON'T match the standard snakeToCamel output appear
// here. Fields like `review_count` → `reviewCount` auto-convert correctly
// and are NOT listed.
// ====================================================================
const FIELD_RENAMES: Record<string, string> = {
  // Sellers / Profiles — non-standard naming
  logo_url: 'logo',
  banner_url: 'banner',
  display_name: 'name',
  avatar_url: 'avatar',
  join_date: 'joinDate',
  last_login_at: 'lastLoginAt',

  // Properties — non-standard naming
  size_sqm: 'size',

  // Property Reviews / Neighborhoods — multi-dimension ratings
  security_rating: 'security',
  cleanliness_rating: 'cleanliness',
  accessibility_rating: 'accessibility',
  amenities_rating: 'amenities',
  value_rating: 'valueForMoney',

  // Community posts — non-standard naming
  image_url: 'image',
  video_url: 'video',
  likes_count: 'likes',
  comments_count: 'comments',
  shares_count: 'shares',
  bookmarks_count: 'bookmarks',
  views_count: 'views',

  // Notifications — non-standard naming
  action_link: 'action',

  // Conversations / Messages — non-standard naming
  last_message: 'lastMessage',
  last_message_time: 'lastMessageTime',
  unread_count: 'unreadCount',
};

/**
 * Converts a single snake_case string to camelCase.
 *
 * @example snakeToCamel('user_id') → 'userId'
 * @example snakeToCamel('created_at') → 'createdAt'
 * @example snakeToCamel('id') → 'id'  (no change)
 */
export function snakeToCamel(str: string): string {
  // Remove leading underscores first
  const cleaned = str.replace(/^_+/, '');
  // Convert snake_case to camelCase
  return cleaned.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transforms all enumerable string keys in an object
 * from snake_case to camelCase.
 *
 * Handles:
 *   - Nested objects (recursive)
 *   - Arrays (recursively transforms each element)
 *   - null / undefined (returned as-is)
 *   - Primitives / Dates (returned as-is)
 *
 * Uses the FIELD_RENAMES map for special cases where the standard
 * snake-to-camel conversion would produce the wrong field name.
 *
 * @example toCamelCase({ user_id: 'abc', created_at: '2024-01-01' })
 *          → { userId: 'abc', createdAt: '2024-01-01' }
 */
export function toCamelCase<T>(obj: T): T {
  // Handle null / undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as unknown as T;
  }

  // Handle primitives and Date objects
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const value = (obj as Record<string, unknown>)[key];

    // Determine the target key name
    const targetKey = key in FIELD_RENAMES ? FIELD_RENAMES[key] : snakeToCamel(key);

    result[targetKey] = toCamelCase(value);
  }

  return result as T;
}
