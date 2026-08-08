/**
 * HAMA Base Supabase Service
 *
 * Provides reusable helpers for Supabase queries — handles
 * common patterns like error handling, pagination, fallback
 * to mock data when tables don't exist yet, and type-safe
 * response transformations.
 */

import { supabase } from '../utils/supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';
import { toCamelCase } from '../utils/transform';

/** Default page size for list queries. */
export const DEFAULT_PAGE_SIZE = 20;

/** Default page size for search queries. */
export const SEARCH_PAGE_SIZE = 50;

/** Generic Supabase response wrapper */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Pagination params for list queries */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** Sort params */
export interface SortParams {
  column: string;
  ascending?: boolean;
}

/**
 * Safely executes a Supabase query, returning a normalized response.
 * Catches and logs errors so callers always get a consistent shape.
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  fallback?: T,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      // Table doesn't exist (42P01) — use fallback if provided
      if (error.code === '42P01' && fallback !== undefined) {
        console.warn(`[Supabase] Table not found, using fallback data: ${error.message}`);
        return { data: fallback, error: null };
      }
      console.error('[Supabase] Query error:', error.message);
      return { data: fallback ?? null, error: error.message };
    }
    // Transform DB rows from snake_case to camelCase
    return { data: data !== null ? toCamelCase(data) as T : null, error: null };
  } catch (err: any) {
    console.error('[Supabase] Unexpected error:', err?.message ?? err);
    return { data: fallback ?? null, error: err?.message ?? 'Unexpected error' };
  }
}

/**
 * Build a range clause for Supabase pagination.
 */
export function paginate(page: number = 1, pageSize: number = 20): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}
