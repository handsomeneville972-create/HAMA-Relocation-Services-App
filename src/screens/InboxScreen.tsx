/**
 * InboxScreen (upgraded)
 *
 * Conversation list with FlatList for performance.
 * Uses ConversationListItem component for each row.
 * Supports pull-to-refresh and real-time unread count updates.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useUserConversations, useUserUnreadCount } from '../hooks/useUserData';
import { ConversationListItem } from '../components/messaging/ConversationListItem';
import { MessageThread } from '../components/messaging/MessageThread';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useResponsive } from '../utils/responsive';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { Conversation } from '../constants/types';

export const InboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { currentUserId } = useAuth();
  const conversations = useUserConversations();
  const totalUnread = useUserUnreadCount();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (isDesktop) {
      setSelectedId(id);
    } else {
      navigation.navigate('Chat', { conversationId: id });
    }
  }, [isDesktop, navigation]);

  const renderItem = useCallback(({ item, index }: { item: Conversation; index: number }) => (
    <ConversationListItem
      conversation={item}
      currentUserId={currentUserId}
      onPress={() => handleSelect(item.id)}
      index={index}
      active={isDesktop && selectedId === item.id}
    />
  ), [currentUserId, handleSelect, isDesktop, selectedId]);

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const ListEmptyComponent = useCallback(() => (
    !loading ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Message a landlord, seller or service provider to get started.
        </Text>
      </View>
    ) : null
  ), [loading]);

  const ListHeaderComponent = useCallback(() => (
    loading ? <SkeletonLoader type="chat" count={5} /> : null
  ), [loading]);

  const conversationList = (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.headerContent, isDesktop && styles.headerContentDesktop]}>
          {!isDesktop && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {totalUnread > 0 ? `${totalUnread} unread` : 'No unread messages'}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isDesktop ? (
        <View style={styles.desktopRow}>
          <View style={styles.desktopList}>{conversationList}</View>
          <View style={styles.desktopPane}>
            {selectedId ? (
              <MessageThread conversationId={selectedId} onBack={() => setSelectedId(null)} />
            ) : (
              <View style={styles.paneEmpty}>
                <View style={styles.paneEmptyIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.paneEmptyTitle}>Select a conversation</Text>
                <Text style={styles.paneEmptySubtitle}>
                  Choose a conversation from the list to start messaging.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        conversationList
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  headerContentDesktop: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  desktopRow: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  desktopList: {
    width: 360,
    borderRightWidth: 1,
    borderRightColor: COLORS.glassBorder,
  },
  desktopPane: {
    flex: 1,
  },
  paneEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  paneEmptyIcon: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  paneEmptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  paneEmptySubtitle: {
    ...FONTS.bodySmall,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textTertiary,
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
  listContent: {
    flexGrow: 1,
    paddingVertical: SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginLeft: 76, // Aligns with content after avatar
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: SPACING.sm,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
