/**
 * MessageComposer
 *
 * Input bar for typing and sending messages.
 * Includes attachment button, text input, and send button.
 * Supports typing indicator emission.
 */

import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onTyping?: () => void;
  sending?: boolean;
  disabled?: boolean;
  replyPreview?: { senderName: string; text: string } | null;
  onCancelReply?: () => void;
  onMic?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  onTyping,
  sending = false,
  disabled = false,
  replyPreview = null,
  onCancelReply,
  onMic,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sendAnim = useRef(new Animated.Value(0)).current;
  const hasText = value.trim().length > 0;

  const animateSendPress = (pressed: boolean) => {
    Animated.spring(sendAnim, {
      toValue: pressed ? 1 : 0,
      damping: 15,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    onTyping?.();
  };

  return (
    <View style={styles.container}>
      {replyPreview && (
        <View style={styles.replyBar}>
          <View style={styles.replyAccent} />
          <View style={styles.replyTextWrap}>
            <Text style={styles.replyName} numberOfLines={1}>
              {replyPreview.senderName}
            </Text>
            <Text style={styles.replySnippet} numberOfLines={1}>
              {replyPreview.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            activeOpacity={0.7}
            style={styles.replyCancel}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.row}>
        <TouchableOpacity style={styles.attachButton} onPress={onAttach} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={26} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={handleChangeText}
            multiline
            maxLength={500}
          />
        </View>

        <Animated.View
          style={{
            transform: [{
              scale: sendAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.9],
              }),
            }],
          }}
        >
          {hasText || sending || disabled ? (
            <TouchableOpacity
              style={[styles.sendButton, hasText && styles.sendButtonActive]}
              onPress={onSend}
              onPressIn={() => animateSendPress(true)}
              onPressOut={() => animateSendPress(false)}
              disabled={!hasText || sending || disabled}
              activeOpacity={0.7}
            >
              {sending ? (
                <Ionicons name="hourglass" size={20} color={colors.textTertiary} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={hasText ? '#fff' : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onMic}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: colors.bgBlur,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
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
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    color: colors.text,
    fontSize: 15,
    maxHeight: 80,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  replyAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  replyTextWrap: {
    flex: 1,
  },
  replyName: {
    ...FONTS.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  replySnippet: {
    ...FONTS.caption,
    color: colors.textSecondary,
  },
  replyCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
