import { Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary - Orange
  primary: '#FF6B00',
  primaryLight: '#FF8A33',
  primaryDark: '#CC5500',
  primaryGlow: 'rgba(255, 107, 0, 0.25)',

  // Secondary - White
  secondary: '#FFFFFF',
  secondaryLight: 'rgba(255, 255, 255, 0.9)',
  secondaryGlow: 'rgba(255, 255, 255, 0.2)',

  // Accent
  accent: '#FF8A33',
  accentLight: '#FFB366',
  accentGlow: 'rgba(255, 138, 51, 0.25)',

  // Background - OLED Black
  bg: '#000000',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  bgCardHover: 'rgba(255, 255, 255, 0.07)',
  bgElevated: 'rgba(255, 255, 255, 0.09)',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',
  bgBlur: 'rgba(0, 0, 0, 0.85)',

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.58)',
  textInverse: '#000000',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(255, 107, 0, 0.5)',

  // Status
  success: '#00D4AA',
  warning: '#FFB84D',
  error: '#FF4D6A',
  info: '#FF8A33',

  // Glass
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.06)',
  glassShadow: 'rgba(0, 0, 0, 0.4)',

  // Gradient presets
  gradientPrimary: ['#FF6B00', '#FF8A33'] as const,
  gradientSecondary: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,
  gradientAccent: ['#FF6B00', '#FFB366'] as const,
  gradientSunset: ['#FF6B00', '#FFB84D'] as const,
  gradientNight: ['#000000', '#0A0A0A'] as const,
  gradientCard: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'] as const,
  gradientPremium: ['#FF6B00', '#FFFFFF'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FONTS = {
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  lg: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  glow: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  hero: 1000,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springLight: {
    damping: 20,
    stiffness: 200,
    mass: 0.5,
  },
};

// Strong easing curves for deliberate motion. UI entrances/exits use easeOut;
// on-screen movement uses easeInOut; sheets/drawers use drawer (iOS-like).
export const EASING = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
};

export const DIMENSIONS = {
  width,
  height,
  cardWidth: (width - SPACING.md * 3) / 2,
  fullWidth: width - SPACING.md * 2,
};

export const BLUR = {
  light: 10,
  medium: 20,
  heavy: 40,
};
