import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PropertyReview } from '../constants/types';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';

interface PropertyReviewCardProps {
  review: PropertyReview;
}

const RatingBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const { colors } = useTheme();
  const ratingStyles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={ratingStyles.row}>
      <Text style={ratingStyles.label}>{label}</Text>
      <View style={ratingStyles.barBg}>
        <View style={[ratingStyles.barFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={ratingStyles.value}>{value}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bgCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
  },
});

export const PropertyReviewCard: React.FC<PropertyReviewCardProps> = ({ review }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles2(colors), [colors]);
  return (
    <View style={styles.card}>
      <LinearGradient colors={colors.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <UserAvatar uri={review.user.avatar} size={36} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{review.user.name}</Text>
            <Text style={styles.date}>{review.createdAt}</Text>
          </View>
          <View style={styles.overallRating}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={styles.overallRatingText}>{review.rating}</Text>
          </View>
        </View>

        {/* Review Content */}
        <Text style={styles.content}>{review.content}</Text>

        {/* Detailed Ratings */}
        <View style={styles.ratingsContainer}>
          <RatingBar label="Security" value={review.security} />
          <RatingBar label="Cleanliness" value={review.cleanliness} />
          <RatingBar label="Accessibility" value={review.accessibility} />
          <RatingBar label="Amenities" value={review.amenities} />
          <RatingBar label="Value for Money" value={review.valueForMoney} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="thumbs-up-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.helpfulText}>{review.helpful} found helpful</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const createStyles2 = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: SPACING.md,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  overallRatingText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  ratingsContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
