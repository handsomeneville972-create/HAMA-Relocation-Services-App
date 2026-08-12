/**
 * ConversationListItem
 *
 * Renders a single conversation row in the inbox.
 * Shows avatar, name, last message, timestamp, unread badge, online indicator.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import type { Conversation, User } from '../../constants/types';

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  index?: number;
  active?: boolean;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserId,
  onPress,
  index = 0,
  active = false,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const otherUser = conversation.participants?.find(
    (p) => p.id !== currentUserId,
  ) || conversation.participants?.[0];

  const lastMessage = conversation.lastMessage || '';
  const lastMessageTime = conversation.lastMessageTime || '';
  const unreadCount = conversation.unreadCount || 0;

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return 'Now';
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <TouchableOpacity style={[styles.container, active && styles.containerActive]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherUser?.avatar || 'https://i.pravatar.cc/150?u=default' }}
            style={styles.avatar}
          />
          {unreadCount > 0 && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, unreadCount > 0 && styles.nameBold]} numberOfLines={1}>
              {otherUser?.name || 'Unknown User'}
            </Text>
            {otherUser?.verified && (
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} style={styles.verifiedBadge} />
            )}
            <Text style={styles.time}>{formatTime(lastMessageTime)}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageBold]}
              numberOfLines={1}
            >
              {lastMessage || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm + 4,
  },
  containerActive: {
    backgroundColor: 'rgba(255,107,0,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.md - 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bgCard,
  },
  unreadDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...FONTS.body,
    color: COLORS.text,
    flex: 1,
  },
  nameBold: {
    fontWeight: '700',
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  time: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lastMessage: {
    ...FONTS.bodySmall,
    color: COLORS.textTertiary,
    flex: 1,
  },
  lastMessageBold: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...FONTS.caption,
    color: '#fff',
    fontWeight: '700',
  },
});
