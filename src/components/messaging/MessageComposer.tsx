/**
 * MessageComposer
 *
 * Input bar for typing and sending messages.
 * Includes attachment button, text input, and send button.
 * Supports typing indicator emission.
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onTyping?: () => void;
  sending?: boolean;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  onTyping,
  sending = false,
  disabled = false,
}) => {
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
      <View style={styles.row}>
        <TouchableOpacity style={styles.attachButton} onPress={onAttach} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={26} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textTertiary}
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
          <TouchableOpacity
            style={[styles.sendButton, hasText && styles.sendButtonActive]}
            onPress={onSend}
            onPressIn={() => animateSendPress(true)}
            onPressOut={() => animateSendPress(false)}
            disabled={!hasText || sending || disabled}
            activeOpacity={0.7}
          >
            {sending ? (
              <Ionicons name="hourglass" size={20} color={COLORS.textTertiary} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={hasText ? '#fff' : COLORS.textTertiary}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgBlur,
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
    padding: 0,
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
