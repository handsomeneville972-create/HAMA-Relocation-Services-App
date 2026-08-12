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
import { COLORS } from '../constants/theme';

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { conversationId } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <MessageThread conversationId={conversationId} onBack={() => navigation.goBack()} />
    </View>
  );
};