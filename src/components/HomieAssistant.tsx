import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

const TIPS = [
  "Hey, I'm Homie. Let's find something perfect for your budget.",
  'Looking for student housing? I can help!',
  'Need help moving? Hamisha Squad has your back!',
  'Your dream home is just a search away!',
  'I can help you budget for your new place!',
];

interface HomieAssistantProps {
  onPress?: () => void;
}

export const HomieAssistant: React.FC<HomieAssistantProps> = ({ onPress }) => {
  const { width } = useResponsive();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    // Floating animation
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floating.start();

    // Breathing glow
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();

    // Rotate tips
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
    }, 5000);

    return () => {
      floating.stop();
      breathing.stop();
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      {showTip && (
        <Animated.View style={styles.tipBubble}>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </Animated.View>
      )}
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ translateY: floatAnim }],
              opacity: breatheAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.md,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBubble: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.sm,
    marginBottom: 8,
    maxWidth: width * 0.65,
    ...SHADOWS.md,
  },
  tipText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
});
