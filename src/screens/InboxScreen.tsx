import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useUserConversations, useUserUnreadCount } from '../hooks/useUserData';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};



export const InboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const conversations = useUserConversations();
  const totalUnread = useUserUnreadCount();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {totalUnread > 0 ? `${totalUnread} unread` : 'No unread messages'}
            </Text>
          </View>
          <TouchableOpacity style={styles.newMessageButton}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <SkeletonLoader type="chat" count={5} />
        ) : conversations.map((conversation, index) => {
          const otherUser = conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0];
          return (
            <ConversationCard
              key={conversation.id}
              avatar={otherUser.avatar}
              name={otherUser.name}
              lastMessage={conversation.lastMessage}
              time={formatTime(conversation.lastMessageTime)}
              unread={conversation.unreadCount}
              verified={otherUser.verified}
              online={conversation.unreadCount > 0}
              onPress={() => navigation.navigate('Chat', { conversationId: conversation.id })}
              index={index}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const ConversationCard: React.FC<{
  avatar: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  verified: boolean;
  online: boolean;
  onPress: () => void;
  index: number;
}> = ({ avatar, name, lastMessage, time, unread, verified, online, onPress, index }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={styles.conversationCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            {online && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {name}
              </Text>
              {verified && <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />}
              <Text style={styles.timeText}>{time}</Text>
            </View>
            <View style={styles.messageRow}>
              <Text style={[styles.message, unread > 0 && styles.unreadMessage]} numberOfLines={1}>
                {lastMessage}
              </Text>
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unread}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
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
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
    flex: 1,
  },
  headerSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
