/**
 * HAMA Property Service
 *
 * Queries properties, property images, amenities, property reviews,
 * and neighborhoods from Supabase. Falls back to mock data.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, DEFAULT_PAGE_SIZE, SEARCH_PAGE_SIZE } from './supabaseService';
import { MOCK_PROPERTIES, MOCK_PROPERTY_REVIEWS, MOCK_NEIGHBORHOODS } from '../constants/data';
import type { Property, PropertyReview, Neighborhood } from '../constants/types';

// ============ PROPERTIES ============

export async function getProperties(params?: {
  landlordId?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  furnished?: boolean;
  limit?: number;
}): Promise<{ data: Property[] | null; error: string | null }> {
  return executeQuery<Property[]>(
    async () => {
      let query = supabase
        .from('properties')
        .select('*, landlord:landlord_id(*, profile:profiles!landlord_id(*))');

      if (params?.landlordId) {
        query = query.eq('landlord_id', params.landlordId);
      }
      if (params?.available !== undefined) {
        query = query.eq('available', params.available);
      }
      if (params?.minPrice !== undefined) {
        query = query.gte('price', params.minPrice);
      }
      if (params?.maxPrice !== undefined) {
        query = query.lte('price', params.maxPrice);
      }
      if (params?.location) {
        query = query.ilike('location', `%${params.location}%`);
      }
      if (params?.furnished !== undefined) {
        query = query.eq('furnished', params.furnished);
      }

      query = query.order('created_at', { ascending: false });

      query = query.limit(params?.limit ?? DEFAULT_PAGE_SIZE);

      const { data, error } = await query;
      return { data: data as unknown as Property[] | null, error };
    },
    MOCK_PROPERTIES,
  );
}

export async function getFeaturedProperties(params?: {
  limit?: number;
  offset?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  sortBy?: string;
}): Promise<{ data: Property[] | null; error: string | null }> {
  return executeQuery<Property[]>(
    async () => {
      let query = supabase
        .from('properties')
        .select('*, landlord:landlord_id(*, profile:profiles!landlord_id(*))');

      if (params?.category && params.category !== 'all') {
        query = query.ilike('title', `%${params.category}%`);
      }
      if (params?.minPrice !== undefined) {
        query = query.gte('price', params.minPrice);
      }
      if (params?.maxPrice !== undefined) {
        query = query.lte('price', params.maxPrice);
      }
      if (params?.bedrooms !== undefined) {
        query = query.eq('bedrooms', params.bedrooms);
      }
      if (params?.bathrooms !== undefined) {
        query = query.eq('bathrooms', params.bathrooms);
      }

      // Sorting
      switch (params?.sortBy) {
        case 'lowest':
          query = query.order('price', { ascending: true });
          break;
        case 'highest':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const limit = params?.limit ?? 20;
      const offset = params?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      return { data: data as unknown as Property[] | null, error };
    },
    MOCK_PROPERTIES,
  );
}

export async function getPropertyById(id: string): Promise<{ data: Property | null; error: string | null }> {
  return executeQuery<Property>(
    async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, landlord:landlord_id(*, profile:profiles!landlord_id(*)), amenities:property_amenities(*)')
        .eq('id', id)
        .single();
      return { data: data as unknown as Property | null, error };
    },
    MOCK_PROPERTIES.find(p => p.id === id) ?? MOCK_PROPERTIES[0],
  );
}

export async function searchProperties(
  query: string,
): Promise<{ data: Property[] | null; error: string | null }> {
  const searchLower = query.toLowerCase();
  return executeQuery<Property[]>(
    async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, landlord:landlord_id(*)')
        .or(`title.ilike.%${searchLower}%,description.ilike.%${searchLower}%,location.ilike.%${searchLower}%`)
        .order('created_at', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as unknown as Property[] | null, error };
    },
    MOCK_PROPERTIES.filter(
      p => p.title.toLowerCase().includes(searchLower) ||
           p.location.toLowerCase().includes(searchLower) ||
           p.description.toLowerCase().includes(searchLower),
    ),
  );
}

// ============ PROPERTY REVIEWS ============

export async function getPropertyReviews(
  propertyId: string,
): Promise<{ data: PropertyReview[] | null; error: string | null }> {
  return executeQuery<PropertyReview[]>(
    async () => {
      const { data, error } = await supabase
        .from('property_reviews')
        .select('*, user:user_id(*)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(DEFAULT_PAGE_SIZE);
      return { data: data as unknown as PropertyReview[] | null, error };
    },
    MOCK_PROPERTY_REVIEWS.filter(r => r.propertyId === propertyId),
  );
}

export async function createPropertyReview(review: {
  propertyId: string;
  userId: string;
  rating: number;
  security?: number;
  cleanliness?: number;
  accessibility?: number;
  amenities?: number;
  valueForMoney?: number;
  content: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('property_reviews')
        .insert({
          property_id: review.propertyId,
          user_id: review.userId,
          rating: review.rating,
          security_rating: review.security,
          cleanliness_rating: review.cleanliness,
          accessibility_rating: review.accessibility,
          amenities_rating: review.amenities,
          value_rating: review.valueForMoney,
          content: review.content,
        })
        .select()
        .single();
      return { data, error };
    },
    null,
  );
}

// ============ NEIGHBORHOODS ============

export async function getNeighborhoods(): Promise<{ data: Neighborhood[] | null; error: string | null }> {
  return executeQuery<Neighborhood[]>(
    async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('rating', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as Neighborhood[] | null, error };
    },
    MOCK_NEIGHBORHOODS,
  );
}

export async function getNeighborhoodById(id: string): Promise<{ data: Neighborhood | null; error: string | null }> {
  return executeQuery<Neighborhood>(
    async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('id', id)
        .single();
      return { data: data as Neighborhood | null, error };
    },
    MOCK_NEIGHBORHOODS.find(n => n.id === id) ?? MOCK_NEIGHBORHOODS[0],
  );
}
