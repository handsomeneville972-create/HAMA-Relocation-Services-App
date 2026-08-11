/**
 * ChatHeader
 *
 * Header bar for the chat screen.
 * Shows back button, avatar, name, online status, and more menu.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { OnlineIndicator } from './OnlineIndicator';
import type { User } from '../../constants/types';

interface ChatHeaderProps {
  user: User;
  isOnline: boolean;
  lastSeen?: string | null;
  onBack: () => void;
  onMore: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  isOnline,
  lastSeen,
  onBack,
  onMore,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Image
          source={{ uri: user.avatar || 'https://i.pravatar.cc/150?u=default' }}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            {user.verified && (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
            )}
          </View>
          <OnlineIndicator isOnline={isOnline} lastSeen={lastSeen} />
        </View>

        <TouchableOpacity style={styles.moreButton} onPress={onMore}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.bg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm + 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
