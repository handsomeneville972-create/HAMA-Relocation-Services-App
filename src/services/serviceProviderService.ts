/**
 * HAMA Service Provider Service
 *
 * Queries service providers and their reviews from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, DEFAULT_PAGE_SIZE, SEARCH_PAGE_SIZE } from './supabaseService';
import { MOCK_SERVICE_PROVIDERS } from '../constants/data';
import type { ProviderProfile, ServiceProvider } from '../constants/types';

/**
 * Fetch the signed-in user's own provider profile (full profile jsonb).
 * Returns null when the user has no published provider row.
 */
export async function getProviderProfileByUserId(
  userId: string,
): Promise<{ data: ProviderProfile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('service_providers')
      .select('profile')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: (data?.profile as ProviderProfile) ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load provider profile' };
  }
}


export async function getServiceProviders(params?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: ServiceProvider[] | null; error: string | null }> {
  return executeQuery<ServiceProvider[]>(
    async () => {
      let query = supabase
        .from('service_providers')
        .select('*')
        .order('rating', { ascending: false });

      if (params?.category) {
        query = query.eq('category', params.category);
      }

      const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
      const offset = params?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      return { data: data as ServiceProvider[] | null, error };
    },
    params?.category
      ? MOCK_SERVICE_PROVIDERS.filter(p => p.category === params.category)
      : MOCK_SERVICE_PROVIDERS,
  );
}

export async function getServiceProviderById(id: string): Promise<{ data: ServiceProvider | null; error: string | null }> {
  return executeQuery<ServiceProvider>(
    async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single();
      return { data: data as ServiceProvider | null, error };
    },
    MOCK_SERVICE_PROVIDERS.find(p => p.id === id) ?? MOCK_SERVICE_PROVIDERS[0],
  );
}

export async function searchServiceProviders(
  query: string,
): Promise<{ data: ServiceProvider[] | null; error: string | null }> {
  const searchLower = query.toLowerCase();
  return executeQuery<ServiceProvider[]>(
    async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%,category.ilike.%${searchLower}%,subcategory.ilike.%${searchLower}%`)
        .order('rating', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as ServiceProvider[] | null, error };
    },
    MOCK_SERVICE_PROVIDERS.filter(
      p => p.name.toLowerCase().includes(searchLower) ||
           p.description.toLowerCase().includes(searchLower) ||
           p.category.toLowerCase().includes(searchLower) ||
           p.subcategory.toLowerCase().includes(searchLower),
    ),
  );
}
