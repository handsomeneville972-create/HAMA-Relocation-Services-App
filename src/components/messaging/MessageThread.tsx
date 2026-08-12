/**
 * MessageThread
 *
 * Self-contained conversation thread (header, message list, composer,
 * context menu, attachment picker, report modal). Used by ChatScreen
 * (full screen) and by InboxScreen's desktop master-detail pane.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationById, sendMessage, editMessage, deleteMessage, markConversationAsRead, uploadAttachment } from '../../services/conversationService';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { SkeletonLoader } from '../SkeletonLoader';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { MessageContextMenu } from './MessageContextMenu';
import { AttachmentPicker } from './AttachmentPicker';
import { ReportModal } from './ReportModal';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { usePresence } from '../../hooks/usePresence';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { useMessages } from '../../hooks/useMessages';
import type { Message, Conversation, User } from '../../constants/types';

const CHAT_BG = require('../../../assets/chat-bg.jpg');

const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at || msg.timestamp || '').toDateString();
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
  });
  return groups;
};

const formatDateHeader = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

interface MessageThreadProps {
  conversationId: string;
  onBack: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ conversationId, onBack }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Context menu state
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [attachmentPickerVisible, setAttachmentPickerVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportedUserId, setReportedUserId] = useState('');

  // Custom hooks
  const { messages, isLoading, loadInitial, loadMore, hasMore, addMessage, updateMessage, removeMessage, replaceOptimistic, removeOptimistic } = useMessages(conversationId);
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingIndicator(conversationId, currentUserId);
  const { isUserOnline, getUserLastSeen } = usePresence(conversationId, currentUserId);
  const { isConnected, broadcast } = useRealtimeMessages(conversationId, currentUserId, {
    onNewMessage: addMessage,
    onMessageEdited: (msgId, content, editedAt) => updateMessage(msgId, { content, text: content, edited_at: editedAt }),
    onMessageDeleted: (msgId) => updateMessage(msgId, { deleted_at: new Date().toISOString() }),
  });

  // Fetch conversation data
  useEffect(() => {
    getConversationById(conversationId).then(({ data }) => {
      if (data) {
        setConversation(data);
        const other = data.participants.find(p => p.id !== currentUserId) || data.participants[0];
        setOtherUser(other ?? null);
        // Load initial messages
        if (data.messages?.length) {
          data.messages.forEach((msg: Message) => addMessage(msg));
        }
      }
    });
  }, [conversationId, currentUserId]);

  // Load messages from DB
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (conversationId && currentUserId) {
      markConversationAsRead(conversationId, currentUserId);
    }
  }, [conversationId, currentUserId]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || sending || !currentUserId) return;
    const text = messageText.trim();
    setMessageText('');
    setSending(true);
    stopTyping();

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      read: false,
    };
    addMessage(optimisticMsg);

    try {
      const { data, error } = await sendMessage({
        conversationId,
        senderId: currentUserId,
        text,
      });

      if (error) {
        removeOptimistic(tempId);
        setMessageText(text);
      } else if (data) {
        replaceOptimistic(tempId, data);
      }
    } catch {
      removeOptimistic(tempId);
      setMessageText(text);
    } finally {
      setSending(false);
    }
  }, [messageText, sending, currentUserId, conversationId, addMessage, removeOptimistic, replaceOptimistic, stopTyping]);

  // Handle typing
  const handleTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  // Handle attachment
  const handleAttach = useCallback(() => {
    setAttachmentPickerVisible(true);
  }, []);

  const handlePickImage = useCallback(async (uri: string, fileName: string) => {
    if (!currentUserId) return;
    setSending(true);

    const { data, error } = await uploadAttachment(uri, fileName, conversationId, currentUserId);
    if (error || !data) {
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
      setSending(false);
      return;
    }

    await sendMessage({
      conversationId,
      senderId: currentUserId,
      text: fileName,
      messageType: 'image',
      attachmentUrl: data.url,
    });

    setSending(false);
  }, [currentUserId, conversationId]);

  // Handle long press (context menu)
  const handleLongPress = useCallback((msg: Message) => {
    setSelectedMessage(msg);
    setContextMenuVisible(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback(async () => {
    if (!selectedMessage) return;
    Alert.prompt?.(
      'Edit Message',
      'Enter new message text:',
      async (newText: string) => {
        if (newText.trim() && newText !== selectedMessage.text) {
          await editMessage(selectedMessage.id, newText.trim());
          updateMessage(selectedMessage.id, { text: newText.trim(), content: newText.trim(), edited_at: new Date().toISOString() });
        }
      },
      'plain-text',
      selectedMessage.text,
    );
  }, [selectedMessage, updateMessage]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedMessage) return;
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMessage(selectedMessage.id);
          removeMessage(selectedMessage.id);
        },
      },
    ]);
  }, [selectedMessage, removeMessage]);

  // Handle report
  const handleReport = useCallback(() => {
    if (!selectedMessage || !currentUserId) return;
    setReportedUserId(selectedMessage.sender_id || '');
    setReportModalVisible(true);
  }, [selectedMessage, currentUserId]);

  // Handle load more (scroll to top)
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  // Render date separator
  const renderDateSeparator = useCallback((date: string) => (
    <View style={styles.dateHeader}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{formatDateHeader(date)}</Text>
      <View style={styles.dateLine} />
    </View>
  ), []);

  // Render message
  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === currentUserId;
    return (
      <MessageBubble
        msg={item}
        isOwn={isOwn}
        avatar={otherUser?.avatar}
        onLongPress={handleLongPress}
      />
    );
  }, [currentUserId, otherUser, handleLongPress]);

  // Group messages by date for rendering
  const dateGroups = groupMessagesByDate(messages);
  const flatListData = dateGroups.flatMap((group, gi) => [
    { type: 'date' as const, date: group.date, id: `date-${gi}` },
    ...group.messages.map(msg => ({ type: 'message' as const, message: msg, id: msg.id })),
  ]);

  const renderFlatItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'date') {
      return renderDateSeparator(item.date);
    }
    return renderItem({ item: item.message, index: 0 });
  }, [renderDateSeparator, renderItem]);

  if (!conversation || !otherUser) {
    return (
      <ImageBackground source={CHAT_BG} style={styles.bgImage} resizeMode="contain" imageStyle={styles.bgImageStyle}>
        <View style={styles.bgOverlay} />
        <SkeletonLoader type="chat" />
      </ImageBackground>
    );
  }

  const isOnline = isUserOnline(otherUser.id);
  const lastSeen = getUserLastSeen(otherUser.id);

  return (
    <ImageBackground
      source={CHAT_BG}
      style={styles.bgImage}
      resizeMode="contain"
      imageStyle={styles.bgImageStyle}
    >
      <View style={styles.bgOverlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <ChatHeader
          user={otherUser}
          isOnline={isOnline}
          lastSeen={lastSeen}
          onBack={onBack}
          onMore={() => {}}
        />

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={flatListData}
          renderItem={renderFlatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ListFooterComponent={
            <TypingIndicator userName={otherUser.name} visible={isOtherUserTyping} />
          }
        />

        {/* Input Bar */}
        <MessageComposer
          value={messageText}
          onChangeText={setMessageText}
          onSend={handleSend}
          onAttach={handleAttach}
          onTyping={handleTyping}
          sending={sending}
        />
      </KeyboardAvoidingView>

      {/* Context Menu */}
      <MessageContextMenu
        visible={contextMenuVisible}
        onClose={() => setContextMenuVisible(false)}
        isOwn={selectedMessage?.sender_id === currentUserId}
        onReply={() => {}}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReport={handleReport}
      />

      {/* Attachment Picker */}
      <AttachmentPicker
        visible={attachmentPickerVisible}
        onClose={() => setAttachmentPickerVisible(false)}
        onPickImage={handlePickImage}
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reporterId={currentUserId}
        reportedUserId={reportedUserId}
        messageId={selectedMessage?.id}
        conversationId={conversationId}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  bgImageStyle: {
    alignSelf: 'center',
    opacity: 1,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  container: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.glassBorder,
  },
  dateText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
  },
});