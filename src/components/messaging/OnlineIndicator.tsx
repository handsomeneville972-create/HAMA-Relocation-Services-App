/**
 * OnlineIndicator
 *
 * Green dot for online status, with optional "Last seen X ago" text.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

interface OnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: string | null;
  showText?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline,
  lastSeen,
  showText = true,
}) => {
  const formatLastSeen = (ts: string): string => {
    const diff = Date.now() - new Date(ts).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!showText) {
    return (
      <View style={[styles.dot, isOnline && styles.dotOnline]} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, isOnline && styles.dotOnline]} />
      <Text style={styles.text}>
        {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textTertiary,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
  },
  text: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
});
