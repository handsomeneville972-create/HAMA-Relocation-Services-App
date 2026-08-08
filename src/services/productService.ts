/**
 * HAMA Product & Seller Service
 *
 * Queries products, sellers, product images, and product reviews
 * from Supabase. Falls back to mock data when the DB tables
 * haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery, paginate, DEFAULT_PAGE_SIZE, SEARCH_PAGE_SIZE, type PaginationParams, type SortParams } from './supabaseService';
import { MOCK_PRODUCTS, MOCK_SELLERS } from '../constants/data';
import type { Product, Seller, ProductCategory } from '../constants/types';

// ============ SELLERS ============

export async function getSellers(): Promise<{ data: Seller[] | null; error: string | null }> {
  return executeQuery<Seller[]>(
    async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('rating', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as Seller[] | null, error };
    },
    MOCK_SELLERS,
  );
}

export async function getSellerById(id: string): Promise<{ data: Seller | null; error: string | null }> {
  return executeQuery<Seller>(
    async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();
      return { data: data as Seller | null, error };
    },
    MOCK_SELLERS.find(s => s.id === id) ?? MOCK_SELLERS[0],
  );
}

export async function getSellerByUserId(userId: string): Promise<{ data: Seller | null; error: string | null }> {
  return executeQuery<Seller>(
    async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return { data: data as Seller | null, error };
    },
    null as any,
  );
}

// ============ PRODUCTS ============

export async function getProducts(params?: {
  category?: string;
  featured?: boolean;
  sellerId?: string;
  pagination?: PaginationParams;
  sort?: SortParams;
}): Promise<{ data: Product[] | null; error: string | null }> {
  return executeQuery<Product[]>(
    async () => {
      let query = supabase.from('products').select('*, seller:seller_id(*)');

      if (params?.category) {
        query = query.eq('category', params.category);
      }
      if (params?.featured !== undefined) {
        query = query.eq('featured', params.featured);
      }
      if (params?.sellerId) {
        query = query.eq('seller_id', params.sellerId);
      }

      const sortCol = params?.sort?.column ?? 'created_at';
      const sortAsc = params?.sort?.ascending ?? false;
      query = query.order(sortCol, { ascending: sortAsc });

      const { from, to } = paginate(params?.pagination?.page ?? 1, params?.pagination?.pageSize ?? DEFAULT_PAGE_SIZE);
      query = query.range(from, to);

      const { data, error } = await query;
      return { data: data as unknown as Product[] | null, error };
    },
    MOCK_PRODUCTS,
  );
}

export async function getProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
  return executeQuery<Product>(
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:seller_id(*)')
        .eq('id', id)
        .single();
      return { data: data as unknown as Product | null, error };
    },
    MOCK_PRODUCTS.find(p => p.id === id) ?? MOCK_PRODUCTS[0],
  );
}

export async function searchProducts(
  query: string,
): Promise<{ data: Product[] | null; error: string | null }> {
  const searchLower = query.toLowerCase();
  return executeQuery<Product[]>(
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:seller_id(*)')
        .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%,category.ilike.%${searchLower}%`)
        .order('created_at', { ascending: false })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as unknown as Product[] | null, error };
    },
    MOCK_PRODUCTS.filter(
      p => p.name.toLowerCase().includes(searchLower) ||
           p.description.toLowerCase().includes(searchLower) ||
           p.category.toLowerCase().includes(searchLower),
    ),
  );
}

// ============ PRODUCT CATEGORIES ============

export async function getProductCategories(): Promise<{ data: ProductCategory[] | null; error: string | null }> {
  return executeQuery<ProductCategory[]>(
    async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .limit(SEARCH_PAGE_SIZE);
      return { data: data as unknown as ProductCategory[] | null, error };
    },
    null as any,
  );
}
