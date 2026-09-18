/**
 * VoicePlayer
 *
 * Inline voice-note player for chat bubbles.
 * Play/pause, tap-to-seek progress bar, time labels, speed toggle.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface VoicePlayerProps {
  uri: string;
  durationSec?: number;
  isOwn?: boolean;
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ uri, durationSec, isOwn }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = useState(1);
  const [trackWidth, setTrackWidth] = useState(0);

  const duration = status.duration && status.duration > 0 ? status.duration : (durationSec ?? 0);
  const position = Math.min(status.currentTime || 0, duration);
  const progress = duration > 0 ? position / duration : 0;

  // Reset to start when playback finishes
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
      player.pause();
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.3) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    player.setPlaybackRate(next);
  };

  const seek = (e: any) => {
    const x = e?.nativeEvent?.locationX ?? 0;
    if (duration > 0 && trackWidth > 0) {
      player.seekTo(Math.max(0, Math.min(1, x / trackWidth)) * duration);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.playBtn}>
        <Ionicons
          name={status.playing ? 'pause' : 'play'}
          size={20}
          color={isOwn ? '#fff' : colors.primary}
        />
      </TouchableOpacity>
      <View style={styles.trackWrap}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={seek}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          style={styles.track}
        >
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </TouchableOpacity>
        <Text style={[styles.time, isOwn && styles.ownTime]}>
          {fmt(position)} / {fmt(duration)}
        </Text>
      </View>
      <TouchableOpacity onPress={cycleRate} activeOpacity={0.7} style={styles.rateBtn}>
        <Text style={[styles.rateText, isOwn && styles.ownTime]}>{rate}x</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 200,
      gap: SPACING.sm,
    },
    playBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.18)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trackWrap: {
      flex: 1,
      gap: 2,
    },
    track: {
      height: 18,
      justifyContent: 'center',
    },
    fill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    time: {
      ...FONTS.caption,
      color: colors.textTertiary,
      fontVariant: ['tabular-nums'],
    },
    ownTime: {
      color: 'rgba(255,255,255,0.8)',
    },
    rateBtn: {
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    rateText: {
      ...FONTS.caption,
      fontWeight: '700',
      color: colors.primary,
    },
  });
