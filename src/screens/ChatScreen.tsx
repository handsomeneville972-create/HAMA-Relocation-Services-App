/**
 * ChatScreen
 *
 * Thin route wrapper around the reusable MessageThread component.
 * The full conversation UI (header, messages, composer, menus) lives
 * in src/components/messaging/MessageThread.tsx so it can also be
 * embedded in the desktop master-detail inbox.
 */

import React from 'react';
import { View } from 'react-native';
import { MessageThread } from '../components/messaging/MessageThread';
import { type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { conversationId } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MessageThread conversationId={conversationId} onBack={() => navigation.goBack()} />
    </View>
  );
};