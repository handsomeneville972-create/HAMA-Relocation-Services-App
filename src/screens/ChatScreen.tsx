import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Animated, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getConversationById, sendMessage, markMessagesAsRead } from '../services/conversationService';
import { softSanitize } from '../utils/sanitize';
import { supabase } from '../utils/supabaseClient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, ANIMATION, EASING } from '../constants/theme';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Message, Conversation, User } from '../constants/types';

const CHAT_BG = require('../../assets/chat-bg.jpg');

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.timestamp || msg.created_at || '').toDateString();
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

// Single message bubble with a subtle fade + rise on mount. Reduced-motion
// users get a quick opacity fade only (movement dropped, comprehension kept).
const MessageBubble: React.FC<{
  msg: Message;
  isOwn: boolean;
  avatar: string;
}> = ({ msg, isOwn, avatar }) => {
  const reducedMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIMATION.fast,
      easing: EASING.easeOut,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, anim]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isOwn && styles.ownMessageRow,
        {
          opacity: anim,
          transform: reducedMotion
            ? []
            : [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {!isOwn && <Image source={{ uri: avatar }} style={styles.messageAvatar} />}
      <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>{msg.text}</Text>
        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
          {formatMessageTime(msg.timestamp || msg.created_at || '')}
          {isOwn && (
            <Ionicons
              name={msg.read ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={msg.read ? COLORS.primary : COLORS.textTertiary}
              style={{ marginLeft: 4 }}
            />
          )}
        </Text>
      </View>
    </Animated.View>
  );
};

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const reducedMotion = useReducedMotion();
  const sendPressAnim = useRef(new Animated.Value(0)).current;

  const animateSendPress = (pressed: boolean) => {
    if (reducedMotion) return;
    Animated.spring(sendPressAnim, {
      toValue: pressed ? 1 : 0,
      damping: 15,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  };

  // Fetch conversation data
  useEffect(() => {
    getConversationById(conversationId).then(({ data }) => {
      if (data) {
        setConversation(data);
        const other = data.participants.find(p => p.id !== currentUserId) || data.participants[0];
        setOtherUser(other ?? null);
        setMessages(data.messages ?? []);
      }
    });
  }, [conversationId, currentUserId]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && currentUserId) {
      markMessagesAsRead(conversationId, currentUserId);
    }
  }, [conversationId, currentUserId]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Mark as read if from other user
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(conversationId, currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  if (!conversation || !otherUser) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SkeletonLoader type="chat" />
      </KeyboardAvoidingView>
    );
  }

  const dateGroups = groupMessagesByDate(messages);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistic add
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data, error } = await sendMessage({
        conversationId,
        senderId: currentUserId,
        text,
      });

      if (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        setMessageText(text); // Restore text
      } else if (data) {
        // Replace optimistic with real message
        setMessages(prev =>
          prev.map(m => (m.id === optimisticMsg.id ? { ...data, id: data.id } : m))
        );
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setMessageText(text);
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>{otherUser.name}</Text>
              {otherUser.verified && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              )}
            </View>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
          <TouchableOpacity style={styles.headerCall}>
            <Ionicons name="call-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ImageBackground
        source={CHAT_BG}
        style={styles.messagesContainer}
        resizeMode="cover"
      >
        <View style={styles.chatOverlay} />
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {dateGroups.map((group, gi) => (
            <View key={gi}>
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{formatDateHeader(group.date)}</Text>
                <View style={styles.dateLine} />
              </View>
              {group.messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId || msg.sender_id === currentUserId;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={isOwn}
                    avatar={otherUser.avatar}
                  />
                );
              })}
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </ImageBackground>

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <LinearGradient colors={[COLORS.bgBlur, COLORS.bg]} style={styles.inputGradient}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textTertiary}
                value={messageText}
                onChangeText={(text) => setMessageText(softSanitize(text))}
                multiline
                maxLength={500}
              />
            </View>
            <Animated.View
              style={{
                transform: [
                  {
                    scale: sendPressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.9],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[styles.sendButton, messageText.trim() ? styles.sendButtonActive : null]}
                onPress={handleSend}
                onPressIn={() => animateSendPress(true)}
                onPressOut={() => animateSendPress(false)}
                disabled={!messageText.trim() || sending}
              >
                {sending ? (
                  <Ionicons name="hourglass" size={20} color={COLORS.textTertiary} />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={messageText.trim() ? '#fff' : COLORS.textTertiary}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 1,
  },
  headerCall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  chatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
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
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  messageText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageTime: {
    color: COLORS.textTertiary,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  inputGradient: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
