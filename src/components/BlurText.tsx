import React, { useEffect, useMemo } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface BlurTextProps extends TextProps {
  text: string;
  delay?: number;
  duration?: number;
  blurAmount?: number;
  variant?: 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  color?: string;
}

const VARIANT_STYLES = {
  title: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
};

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 0,
  duration = 800,
  blurAmount = 12,
  variant = 'body',
  color,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedColor = color ?? colors.text;
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-15);
  const blur = useSharedValue(blurAmount);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    );
    blur.value = withDelay(
      delay,
      withTiming(0, { duration: duration * 0.8, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const words = text.split(' ');

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {words.map((word, i) => {
        const wordDelay = delay + (i * duration) / (words.length * 3);
        return (
          <BlurWord
            key={`${word}-${i}`}
            word={i < words.length - 1 ? `${word} ` : word}
            delay={wordDelay}
            duration={duration * 0.6}
            blurAmount={blurAmount}
            style={[VARIANT_STYLES[variant], { color: resolvedColor }, style]}
          />
        );
      })}
    </Animated.View>
  );
};

interface BlurWordProps {
  word: string;
  delay: number;
  duration: number;
  blurAmount: number;
  style?: any;
}

const BlurWord: React.FC<BlurWordProps> = ({ word, delay, duration, blurAmount, style }) => {
  const opacity = useSharedValue(0);
  const blur = useSharedValue(blurAmount);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    blur.value = withDelay(
      delay,
      withTiming(0, { duration: duration * 0.8, easing: Easing.out(Easing.cubic) })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {word}
    </Animated.Text>
  );
};

export const FadeInView: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: any;
  slideUp?: boolean;
  slideDistance?: number;
}> = ({ children, delay = 0, duration = 600, style, slideUp = false, slideDistance = 20 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(slideUp ? slideDistance : 0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    if (slideUp) {
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
