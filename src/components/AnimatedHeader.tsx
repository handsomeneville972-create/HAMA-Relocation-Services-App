import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: readonly [string, string];
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  gradient,
  style,
  children,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={gradient ?? colors.gradientNight} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.container, { paddingTop: insets.top + SPACING.md }, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </LinearGradient>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h1,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.bodySmall,
    color: colors.textSecondary,
  },
});
