import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  MOCK_CONVERSATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_PROPERTIES,
  MOCK_PRODUCTS,
  MOCK_COMMUNITY_POSTS,
  MOCK_PROPERTY_REVIEWS,
  MOCK_SAVED_ITEMS,
} from '../constants/data';
import { Conversation, Notification } from '../constants/types';
import { getUserFavorites } from '../services/favoriteService';
import { getUserConversations as getSupabaseConversations } from '../services/conversationService';
import { getNotifications } from '../services/notificationService';

/**
 * Returns the current user's full profile.
 */
export const useCurrentUser = () => {
  const { currentUser } = useAuth();
  return currentUser;
};

/**
 * Returns saved/favorited items scoped to the current user.
 * Queries Supabase first, falls back to mock data.
 */
export const useUserFavorites = () => {
  const { currentUserId } = useAuth();
  const [data, setData] = useState<{
    properties: typeof MOCK_PROPERTIES;
    products: typeof MOCK_PRODUCTS;
    posts: typeof MOCK_COMMUNITY_POSTS;
    saved: { propertyIds: string[]; productIds: string[]; postIds: string[] };
  }>(() => {
    const saved = MOCK_SAVED_ITEMS[currentUserId] ?? MOCK_SAVED_ITEMS['default'];
    return {
      properties: MOCK_PROPERTIES.filter(p => (saved.propertyIds ?? []).includes(p.id)),
      products: MOCK_PRODUCTS.filter(p => (saved.productIds ?? []).includes(p.id)),
      posts: MOCK_COMMUNITY_POSTS.filter(p => (saved.postIds ?? []).includes(p.id)),
      saved,
    };
  });

  useEffect(() => {
    if (!currentUserId) return;

    getUserFavorites(currentUserId).then(({ data: favData }) => {
      if (!favData) return;

      const saved = {
        propertyIds: favData.propertyIds ?? [],
        productIds: favData.productIds ?? [],
        postIds: favData.postIds ?? [],
      };

      // Use mock data for the actual items since we're still transitioning
      // In a full migration, these would also come from Supabase
      setData({
        properties: MOCK_PROPERTIES.filter(p => saved.propertyIds.includes(p.id)),
        products: MOCK_PRODUCTS.filter(p => saved.productIds.includes(p.id)),
        posts: MOCK_COMMUNITY_POSTS.filter(p => saved.postIds.includes(p.id)),
        saved,
      });
    });
  }, [currentUserId]);

  return data;
};

/**
 * Returns conversations where the current user is a participant.
 * Queries Supabase first, falls back to mock data.
 */
export const useUserConversations = (): {
  conversations: Conversation[];
  loading: boolean;
  refresh: () => Promise<void>;
} => {
  const { currentUserId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    MOCK_CONVERSATIONS.filter(conv =>
      conv.participants.some(p => p.id === currentUserId)
    )
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUserId) return;
    const { data } = await getSupabaseConversations(currentUserId);
    if (data && data.length > 0) {
      setConversations(data);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [currentUserId, refresh]);

  return { conversations, loading, refresh };
};

/**
 * Returns total unread count from all of the current user's conversations.
 */
export const useUserUnreadCount = (): number => {
  const { conversations } = useUserConversations();

  return useMemo(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);
};

/**
 * Returns notifications scoped to the current user.
 * Queries Supabase first, falls back to mock data.
 */
export const useUserNotifications = (): Notification[] => {
  const { currentUserId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    if (!currentUserId) return;

    getNotifications(currentUserId).then(({ data }) => {
      if (data && data.length > 0) {
        setNotifications(data);
      }
    });
  }, [currentUserId]);

  return notifications;
};

/**
 * Returns the count of property reviews written by the current user.
 */
export const useUserReviewCount = (): number => {
  const { currentUserId } = useAuth();

  return useMemo(() => {
    return MOCK_PROPERTY_REVIEWS.filter(r => r.user.id === currentUserId).length;
  }, [currentUserId]);
};

interface ProfileBadges {
  /** Map of badgeKey → display string for menu item badges */
  dynamicBadges: Record<string, string>;
  /** Number of saved/favorited properties */
  savedPropertiesCount: number;
  /** Number of saved/favorited products */
  savedProductsCount: number;
  /** Number of saved/favorited posts */
  savedPostsCount: number;
  /** Number of property reviews written by the current user */
  reviewCount: number;
  /** Total bookmarks across all categories */
  bookmarkCount: number;
}

/**
 * Returns all badge counts and stat values for the user's profile.
 * Centralises the dynamic badge resolution so screens don't compute inline.
 */
export const useProfileBadges = (): ProfileBadges => {
  const { currentUserId } = useAuth();
  const { properties, products, posts } = useUserFavorites();
  const unreadMessages = useUserUnreadCount();
  const reviewCount = useUserReviewCount();

  return useMemo(() => {
    const savedPropertiesCount = properties.length;
    const savedProductsCount = products.length;
    const savedPostsCount = posts.length;
    const bookmarkCount = savedPropertiesCount + savedProductsCount + savedPostsCount;

    return {
      dynamicBadges: {
        savedProperties: savedPropertiesCount.toString(),
        savedProducts: savedProductsCount.toString(),
        savedPosts: savedPostsCount.toString(),
        unreadMessages: unreadMessages > 0 ? unreadMessages.toString() : '',
        myReviews: reviewCount > 0 ? reviewCount.toString() : '',
      },
      savedPropertiesCount,
      savedProductsCount,
      savedPostsCount,
      reviewCount,
      bookmarkCount,
    };
  }, [properties, products, posts, unreadMessages, reviewCount]);
};
