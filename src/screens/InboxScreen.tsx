/**
 * InboxScreen
 *
 * TikTok-style message center:
 * - "Active Now" horizontal strip of online conversation partners
 * - Category tabs: All / Unread / Landlords / Sellers / Providers
 * - Conversation list rendered as user profile rows
 * - Tapping a user opens their full-screen chat (mobile-first; no split pane)
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useUserConversations, useUserUnreadCount } from '../hooks/useUserData';
import { useInboxPresence } from '../hooks/useInboxPresence';
import { ConversationListItem } from '../components/messaging/ConversationListItem';
import { UserAvatar } from '../components/UserAvatar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import type { Conversation, User } from '../constants/types';

type InboxTab = 'all' | 'unread' | 'landlords' | 'sellers' | 'providers';

const TABS: { key: InboxTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'landlords', label: 'Landlords' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'providers', label: 'Providers' },
];

const getTabForConversation = (conv: Conversation, currentUserId: string): InboxTab => {
  if (conv.property_id) return 'landlords';
  if (conv.product_id) return 'sellers';
  if (conv.service_provider_id) return 'providers';
  const other = conv.participants.find((p) => p.id !== currentUserId) || conv.participants?.[0];
  switch (other?.role) {
    case 'landlord':
      return 'landlords';
    case 'seller':
      return 'sellers';
    case 'service_provider':
      return 'providers';
    default:
      return 'all';
  }
};

export const InboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const conversations = useUserConversations();
  const totalUnread = useUserUnreadCount();
  const { isUserOnline } = useInboxPresence(currentUserId);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<InboxTab>('all');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const getOtherUser = useCallback(
    (conv: Conversation): User | undefined =>
      conv.participants?.find((p) => p.id !== currentUserId) || conv.participants?.[0],
    [currentUserId],
  );

  // Distinct online conversation partners for the "Active Now" strip
  const activeUsers = useMemo(() => {
    const seen = new Set<string>();
    const users: { user: User; conversationId: string }[] = [];
    conversations.forEach((conv) => {
      const other = getOtherUser(conv);
      if (other && isUserOnline(other.id) && !seen.has(other.id)) {
        seen.add(other.id);
        users.push({ user: other, conversationId: conv.id });
      }
    });
    return users;
  }, [conversations, getOtherUser, isUserOnline]);

  // Filter conversations by the active tab
  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return conversations.filter((c) => c.unreadCount > 0);
      case 'all':
        return conversations;
      default:
        return conversations.filter((c) => getTabForConversation(c, currentUserId || '') === activeTab);
    }
  }, [activeTab, conversations, currentUserId]);

  const handleOpenChat = useCallback(
    (conversationId: string) => {
      navigation.navigate('Chat', { conversationId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => {
      const other = getOtherUser(item);
      return (
        <ConversationListItem
          conversation={item}
          currentUserId={currentUserId}
          onPress={() => handleOpenChat(item.id)}
          index={index}
          isOnline={other ? isUserOnline(other.id) : false}
        />
      );
    },
    [currentUserId, getOtherUser, handleOpenChat, isUserOnline],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const ListEmptyComponent = useCallback(
    () =>
      !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={34} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'unread' ? 'No unread messages' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'unread'
              ? 'You are all caught up.'
              : 'Message a landlord, seller or service provider to get started.'}
          </Text>
        </View>
      ) : null,
    [loading, activeTab],
  );

  const ListHeaderComponent = useCallback(
    () => (loading ? <SkeletonLoader type="chat" count={5} /> : null),
    [loading],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {totalUnread > 0 ? `${totalUnread} unread` : 'No unread messages'}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Active Now strip */}
      {!loading && activeUsers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeStrip}
        >
          {activeUsers.map(({ user, conversationId }) => (
            <TouchableOpacity
              key={user.id}
              style={styles.activeItem}
              onPress={() => handleOpenChat(conversationId)}
              activeOpacity={0.7}
            >
              <View style={styles.activeAvatarWrap}>
                <UserAvatar uri={user.avatar} size={56} style={styles.activeAvatar} />
                <View style={styles.activeDot} />
              </View>
              <Text style={styles.activeName} numberOfLines={1}>{user.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Category tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                {tab.key === 'unread' && totalUnread > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Conversation list */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.h1,
    color: colors.text,
  },
  headerSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStrip: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  activeItem: {
    alignItems: 'center',
    width: 64,
    gap: 4,
  },
  activeAvatarWrap: {
    position: 'relative',
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.bgCard,
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  activeName: {
    ...FONTS.caption,
    color: colors.textSecondary,
    fontSize: 11,
    maxWidth: 64,
  },
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...FONTS.h3,
    color: colors.text,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    ...FONTS.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
