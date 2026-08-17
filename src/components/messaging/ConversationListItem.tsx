/**
 * ConversationListItem
 *
 * TikTok-style user profile row for the inbox:
 * large avatar with an online ring, name + verified badge, role chip,
 * media-type icon for non-text messages, timestamp, and unread badge.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { UserAvatar } from '../UserAvatar';
import type { Conversation, User } from '../../constants/types';

const ROLE_CHIPS: Record<string, { label: string; color: string; icon: string }> = {
  landlord: { label: 'Landlord', color: '#FF6B00', icon: 'home-outline' },
  seller: { label: 'Seller', color: '#00D4AA', icon: 'pricetag-outline' },
  service_provider: { label: 'Provider', color: '#8B5CF6', icon: 'construct-outline' },
};

const MESSAGE_TYPE_ICONS: Record<string, string> = {
  image: 'image-outline',
  file: 'document-outline',
  property: 'home-outline',
  product: 'pricetag-outline',
  service_provider: 'construct-outline',
  location: 'location-outline',
  system: 'megaphone-outline',
};

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  index?: number;
  isOnline?: boolean;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserId,
  onPress,
  index = 0,
  isOnline = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      delay: Math.min(index, 6) * 45,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const otherUser: User | undefined =
    conversation.participants?.find((p) => p.id !== currentUserId) ||
    conversation.participants?.[0];

  const lastMessage = conversation.lastMessage || '';
  const lastMessageTime = conversation.lastMessageTime || '';
  const unreadCount = conversation.unreadCount || 0;
  const messageType = conversation.messages?.[conversation.messages.length - 1]?.message_type;
  const typeIcon = messageType ? MESSAGE_TYPE_ICONS[messageType] : null;
  const roleChip = otherUser ? ROLE_CHIPS[otherUser.role] : undefined;

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

  const previewPrefix = typeIcon ? (
    <Ionicons name={typeIcon as any} size={14} color={colors.textTertiary} style={styles.previewIcon} />
  ) : null;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        {/* Avatar with online ring */}
        <View style={[styles.avatarWrap, isOnline && styles.avatarWrapOnline]}>
          <UserAvatar uri={otherUser?.avatar} size={52} style={styles.avatar} />
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, unreadCount > 0 && styles.nameBold]}
              numberOfLines={1}
            >
              {otherUser?.name || 'Unknown User'}
            </Text>
            {otherUser?.verified && (
              <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            )}
            <View style={styles.timeBox}>
              <Text style={styles.time}>{formatTime(lastMessageTime)}</Text>
            </View>
          </View>

          <View style={styles.midRow}>
            {roleChip && (
              <View style={[styles.roleChip, { backgroundColor: roleChip.color + '1F' }]}>
                <Ionicons name={roleChip.icon as any} size={10} color={roleChip.color} />
                <Text style={[styles.roleText, { color: roleChip.color }]}>{roleChip.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomRow}>
            {previewPrefix}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  avatarWrapOnline: {
    borderColor: colors.success,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgCard,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.bg,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...FONTS.body,
    color: colors.text,
    flex: 1,
  },
  nameBold: {
    fontWeight: '700',
  },
  timeBox: {
    marginLeft: 'auto',
  },
  time: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  midRow: {
    flexDirection: 'row',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewIcon: {
    marginRight: 1,
  },
  lastMessage: {
    ...FONTS.bodySmall,
    color: colors.textTertiary,
    flex: 1,
  },
  lastMessageBold: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
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
