/**
 * UnreadBadge
 *
 * Displays unread message count in a styled badge.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

interface UnreadBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  size = 'medium',
}) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : String(count);
  const sizeStyle = size === 'small' ? styles.badgeSmall : size === 'large' ? styles.badgeLarge : styles.badgeMedium;
  const textStyle = size === 'small' ? styles.textSmall : size === 'large' ? styles.textLarge : styles.textMedium;

  return (
    <View style={[styles.badge, sizeStyle]}>
      <Text style={[styles.text, textStyle]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeSmall: {
    minWidth: 16,
    height: 16,
  },
  badgeMedium: {
    minWidth: 20,
    height: 20,
  },
  badgeLarge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 11,
  },
  textLarge: {
    fontSize: 12,
  },
});
