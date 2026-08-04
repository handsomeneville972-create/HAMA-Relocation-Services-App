/**
 * HAMA™ Thumbnail Card
 *
 * A card component inspired by YouTube video thumbnails.
 * Features a rounded thumbnail image area at the top with
 * title and description below.
 *
 * Perfect for 2-column grid layouts on the About page.
 * Supports placeholder gradients until user images are uploaded.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface ThumbnailCardProps {
  /** Title displayed below the thumbnail */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional image URI (string URL) or local asset (number from require()) — if not provided, renders a gradient placeholder */
  imageUri?: string | number;
  /** Gradient colors for the placeholder (when no imageUri) */
  placeholderGradient?: readonly [string, string];
  /** Icon to show on the placeholder */
  placeholderIcon?: string;
  /** Optional onPress handler */
  onPress?: () => void;
  /** Optional badge text (e.g. "NEW", "POPULAR", "BETA") */
  badge?: string;
  /** Optional small metadata line below title */
  meta?: string;
  /** Container style override */
  style?: ViewStyle;
  /** Card width (defaults to half screen width minus spacing) */
  width?: number;
  /** Thumbnail aspect ratio (width/height). Default 16:9 → 1.78 */
  aspectRatio?: number;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  title,
  description,
  imageUri,
  placeholderGradient,
  placeholderIcon,
  onPress,
  badge,
  meta,
  style,
  width,
  aspectRatio = 16 / 9,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle fade-in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        width ? { width } : undefined,
        style,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* ===== THUMBNAIL AREA (rounded, like YouTube) ===== */}
      <View style={[styles.thumbnailContainer, { aspectRatio }]}>
        {imageUri ? (
          <Image
            source={typeof imageUri === 'number' ? imageUri : { uri: imageUri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={placeholderGradient || [COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholderGradient}
          >
            <Ionicons
              name={(placeholderIcon || 'image-outline') as any}
              size={32}
              color="rgba(255,255,255,0.6)"
            />
          </LinearGradient>
        )}

        {/* Play button overlay (YouTube-style) */}
        {onPress && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={18} color="#fff" />
            </View>
          </View>
        )}

        {/* Badge (e.g. NEW, POPULAR, BETA) */}
        {badge && (
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.warning]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeText}>{badge}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Duration-style timestamp placeholder */}
        <View style={styles.durationContainer}>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={10} color="#fff" />
          </View>
        </View>
      </View>

      {/* ===== CONTENT BELOW THUMBNAIL ===== */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
        {meta && (
          <View style={styles.metaRow}>
            <Ionicons name="ellipse" size={8} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{meta}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ===== SECTION GRID HELPER =====
// Wraps ThumbnailCards in a 2-column responsive grid

interface ThumbnailGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({ children, style }) => {
  const items = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((item, colIndex) => (
            <View key={colIndex} style={styles.gridCol}>
              {item}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  // Thumbnail
  thumbnailContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Play overlay
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  // Badge
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  badgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Duration placeholder
  durationContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content
  contentContainer: {
    padding: SPACING.sm,
    gap: 4,
  },
  title: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  description: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  // Grid
  grid: {
    gap: SPACING.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  gridCol: {
    flex: 1,
  },
});
