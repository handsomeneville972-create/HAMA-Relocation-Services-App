/**
 * VoiceRecordBar
 *
 * Tap-to-record voice note UI shown above the composer.
 * Live timer, 5-minute cap with auto-stop, cancel + send actions.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

export const MAX_VOICE_SECONDS = 300; // 5 minutes

interface VoiceRecordBarProps {
  onCancel: () => void;
  onSend: (uri: string, durationSec: number) => void;
}

const formatClock = (totalSec: number) => {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VoiceRecordBar: React.FC<VoiceRecordBarProps> = ({ onCancel, onSend }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const status = useAudioRecorderState(recorder, 250);
  const [denied, setDenied] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const stoppedRef = useRef(false);

  const elapsedSec = Math.floor((status.durationMillis || 0) / 1000);

  // Pulse animation while recording
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Start recording on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
          setDenied(true);
          return;
        }
        await recorder.prepareToRecordAsync();
        if (!cancelled) recorder.record();
      } catch {
        if (!cancelled) {
          Alert.alert('Microphone unavailable', 'Could not start recording. Please try again.');
          onCancel();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-stop at the cap
  useEffect(() => {
    if (status.isRecording && elapsedSec >= MAX_VOICE_SECONDS) {
      finish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSec, status.isRecording]);

  const finish = async (send: boolean) => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    try {
      await recorder.stop();
    } catch {
      // stop on a non-recording state throws — treat as cancel
      onCancel();
      return;
    }
    const uri = recorder.uri;
    const secs = Math.max(1, Math.floor((status.durationMillis || 0) / 1000));
    if (send && uri) {
      onSend(uri, secs);
    } else {
      onCancel();
    }
  };

  if (denied) {
    return (
      <View style={styles.container}>
        <Ionicons name="mic-off-outline" size={20} color={colors.textTertiary} />
        <Text style={styles.deniedText}>
          Microphone permission denied. Enable it in Settings to send voice notes.
        </Text>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.cancelBtn}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={styles.recDot} />
      </Animated.View>
      <Text style={styles.timer}>{formatClock(elapsedSec)}</Text>
      <Text style={styles.hint}>Recording… tap send when done</Text>
      <TouchableOpacity onPress={() => finish(false)} activeOpacity={0.7} style={styles.cancelBtn}>
        <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => finish(true)} activeOpacity={0.7} style={styles.sendBtn}>
        <Ionicons name="send" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 10,
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    recDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#FF3B30',
    },
    timer: {
      ...FONTS.body,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    hint: {
      ...FONTS.caption,
      color: colors.textTertiary,
      flex: 1,
    },
    deniedText: {
      ...FONTS.caption,
      color: colors.textSecondary,
      flex: 1,
    },
    cancelBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
