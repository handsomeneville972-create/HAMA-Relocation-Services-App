/**
 * HAMA™ Feedback Card Component
 *
 * Collects user feedback with star ratings and open text.
 * Used across the platform to gather user insights during Early Access.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { logEvent } from '../utils/analytics';

interface FeedbackCardProps {
  onSubmit?: (rating: number, love: string, improve: string, nextFeature: string) => void;
  compact?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ onSubmit, compact }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [love, setLove] = useState('');
  const [improve, setImprove] = useState('');
  const [nextFeature, setNextFeature] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Please select a rating');
      return;
    }

    logEvent('feedback_submitted', { rating, has_love: !!love, has_improve: !!improve, has_feature: !!nextFeature });

    if (onSubmit) {
      onSubmit(rating, love, improve, nextFeature);
    }

    setSubmitted(true);

    // Reset after 5 seconds for new feedback
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setLove('');
      setImprove('');
      setNextFeature('');
    }, 5000);
  };

  if (submitted) {
    return (
      <GlassCard>
        <View style={styles.submittedContainer}>
          <LinearGradient
            colors={COLORS.gradientPremium}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successIcon}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.submittedTitle}>Thank You!</Text>
          <Text style={styles.submittedText}>
            Your feedback helps shape the future of HAMA™.
          </Text>
        </View>
      </GlassCard>
    );
  }

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <GlassCard>
      <View style={styles.container}>
        <Text style={styles.title}>Share Your Feedback</Text>
        <Text style={styles.subtitle}>
          Help us improve HAMA™ — your input matters
        </Text>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionLabel}>Overall Experience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoveredRating(star)}
                onPressOut={() => setHoveredRating(0)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= (hoveredRating || rating) ? 'star' : 'star-outline'}
                  size={compact ? 28 : 36}
                  color={star <= (hoveredRating || rating) ? COLORS.warning : COLORS.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
          )}
        </View>

        {/* What do you love? */}
        <View style={styles.fieldSection}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="heart-outline" size={15} color={COLORS.secondary} />
            <Text style={styles.sectionLabel}>What do you love?</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Tell us what's working well..."
            placeholderTextColor={COLORS.textTertiary}
            value={love}
            onChangeText={setLove}
            multiline
            numberOfLines={compact ? 2 : 3}
          />
        </View>

        {/* What can we improve? */}
        <View style={styles.fieldSection}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="construct-outline" size={15} color={COLORS.warning} />
            <Text style={styles.sectionLabel}>What can we improve?</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Share suggestions for improvement..."
            placeholderTextColor={COLORS.textTertiary}
            value={improve}
            onChangeText={setImprove}
            multiline
            numberOfLines={compact ? 2 : 3}
          />
        </View>

        {/* What feature should we build next? */}
        <View style={styles.fieldSection}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="rocket-outline" size={15} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>What feature should we build next?</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Describe your ideal feature..."
            placeholderTextColor={COLORS.textTertiary}
            value={nextFeature}
            onChangeText={setNextFeature}
            multiline
            numberOfLines={compact ? 2 : 3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.submitText}>Submit Feedback</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  submittedContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittedTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  submittedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: -8,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldSection: {
    gap: 6,
  },
  textInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    color: COLORS.text,
    fontSize: 14,
    padding: SPACING.md,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
