import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface LiquidGlassProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle' | 'modal';
  noPadding?: boolean;
  noBorder?: boolean;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
  noBorder = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const variantConfig = {
    default: {
      bg: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const,
      border: 'rgba(255,255,255,0.08)',
      highlight: 'rgba(255,255,255,0.06)',
    },
    elevated: {
      bg: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,
      border: 'rgba(255,255,255,0.12)',
      highlight: 'rgba(255,255,255,0.08)',
    },
    subtle: {
      bg: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] as const,
      border: 'rgba(255,255,255,0.05)',
      highlight: 'rgba(255,255,255,0.03)',
    },
    modal: {
      bg: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'] as const,
      border: 'rgba(255,255,255,0.10)',
      highlight: 'rgba(255,255,255,0.07)',
    },
  };

  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.container,
        !noBorder && { borderColor: config.border, borderWidth: 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={config.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, noPadding && { padding: 0 }]}
      >
        {/* Top highlight — mimics light hitting the glass */}
        <View style={[styles.topHighlight, { backgroundColor: config.highlight }]} />

        {/* Content */}
        <View style={[!noPadding && styles.content, noPadding && { padding: 0 }]}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

/** Liquid glass input container with icon slot */
export const LiquidInput: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  focused?: boolean;
}> = ({ children, style, focused }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        style,
      ]}
    >
      {children}
    </View>
  );
};

/** Liquid glass card — pre-configured card with glass effect */
export const LiquidCard: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LiquidGlass variant="default" style={[styles.card, style]}>
      {onPress ? (
        <View onTouchEnd={onPress} style={styles.cardPressable}>
          {children}
        </View>
      ) : (
        children
      )}
    </LiquidGlass>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gradient: {
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  content: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,107,0,0.05)',
  },
  card: {
    borderRadius: RADIUS.lg,
  },
  cardPressable: {
    flex: 1,
  },
});
