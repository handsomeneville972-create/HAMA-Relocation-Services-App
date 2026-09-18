/**
 * MessageBubble
 *
 * Renders a single message bubble with support for all message types:
 * text, image, file, property, product, service_provider, location, system.
 * Includes read receipts, edited indicator, deleted state, and context menu.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, ANIMATION, EASING, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PropertyMessageCard } from './PropertyMessageCard';
import { ProductMessageCard } from './ProductMessageCard';
import { ServiceProviderMessageCard } from './ServiceProviderMessageCard';
import { VoicePlayer } from './VoicePlayer';
import { UserAvatar } from '../UserAvatar';
import type { Message } from '../../constants/types';

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  avatar?: string;
  onLongPress?: (msg: Message) => void;
  onPress?: (msg: Message) => void;
  replyTo?: { senderName: string; text: string } | null;
  onQuotePress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isOwn,
  avatar,
  onLongPress,
  onPress,
  replyTo = null,
  onQuotePress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const isDeleted = !!msg.deleted_at;
  const isEdited = !!msg.edited_at;
  const messageType = msg.message_type || 'text';

  // Voice note duration is encoded in the label: "🎤 Voice message (M:SS)"
  const voiceDurationSec = useMemo(() => {
    if (messageType !== 'voice') return undefined;
    const m = (msg.text || msg.content || '').match(/(\d+):(\d{2})/);
    if (!m) return undefined;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }, [messageType, msg.text, msg.content]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System messages render centered and muted
  if (messageType === 'system' || isDeleted) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>
          {isDeleted ? 'This message was deleted.' : msg.text || msg.content}
        </Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (messageType) {
      case 'image':
        return (
          <View>
            {msg.attachment_url && (
              <Image source={{ uri: msg.attachment_url }} style={styles.messageImage} resizeMode="cover" />
            )}
            {msg.text && msg.text !== msg.attachment_url && (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>{msg.text}</Text>
            )}
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Ionicons name="document-outline" size={24} color={colors.primary} />
            <View style={styles.fileInfo}>
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]} numberOfLines={1}>
                {msg.text || 'File attachment'}
              </Text>
            </View>
          </View>
        );

      case 'voice':
        return msg.attachment_url ? (
          <VoicePlayer uri={msg.attachment_url} durationSec={voiceDurationSec} isOwn={isOwn} />
        ) : (
          <View style={styles.fileContainer}>
            <Ionicons name="mic-outline" size={24} color={colors.primary} />
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {msg.text || 'Voice message'}
            </Text>
          </View>
        );

      case 'property':
        return msg.property_id ? (
          <PropertyMessageCard propertyId={msg.property_id} />
        ) : (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {msg.text || msg.content}
          </Text>
        );

      case 'product':
        return msg.product_id ? (
          <ProductMessageCard productId={msg.product_id} />
        ) : (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {msg.text || msg.content}
          </Text>
        );

      case 'service_provider':
        return msg.service_provider_id ? (
          <ServiceProviderMessageCard serviceProviderId={msg.service_provider_id} />
        ) : (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {msg.text || msg.content}
          </Text>
        );

      case 'location':
        return (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {msg.text || 'Shared location'}
            </Text>
          </View>
        );

      default:
        return (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {msg.text || msg.content}
          </Text>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isOwn && styles.ownMessageRow,
        {
          opacity: anim,
          transform: reducedMotion
            ? []
            : [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      {!isOwn && avatar && <UserAvatar uri={avatar} size={30} style={styles.messageAvatar} />}

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => onLongPress?.(msg)}
        onPress={() => onPress?.(msg)}
        style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        {replyTo && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onQuotePress}
            style={styles.quoteContainer}
          >
            <View style={styles.quoteAccent} />
            <View style={styles.quoteTextWrap}>
              <Text
                style={[styles.quoteName, isOwn && styles.ownQuoteName]}
                numberOfLines={1}
              >
                {replyTo.senderName}
              </Text>
              <Text
                style={[styles.quoteText, isOwn && styles.ownQuoteText]}
                numberOfLines={2}
              >
                {replyTo.text}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {renderContent()}

        <View style={styles.metaRow}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(msg.created_at || msg.timestamp || '')}
          </Text>

          {isEdited && (
            <Text style={[styles.editedLabel, isOwn && styles.ownEditedLabel]}>edited</Text>
          )}

          {isOwn && (
            <Ionicons
              name={msg.id.startsWith('temp-') ? 'checkmark' : 'checkmark-done'}
              size={14}
              color={
                msg.read && !msg.id.startsWith('temp-')
                  ? colors.primary
                  : colors.textTertiary
              }
              style={styles.readIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
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
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageText: {
    ...FONTS.body,
    color: colors.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  editedLabel: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  ownEditedLabel: {
    color: 'rgba(255,255,255,0.6)',
  },
  readIcon: {
    marginLeft: 2,
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  systemText: {
    ...FONTS.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fileInfo: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quoteContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 8,
  },
  quoteAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  quoteTextWrap: {
    flex: 1,
  },
  quoteName: {
    ...FONTS.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  ownQuoteName: {
    color: '#fff',
  },
  quoteText: {
    ...FONTS.caption,
    color: colors.textSecondary,
  },
  ownQuoteText: {
    color: 'rgba(255,255,255,0.85)',
  },
});
