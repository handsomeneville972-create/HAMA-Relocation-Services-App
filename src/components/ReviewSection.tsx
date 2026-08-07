/**
 * ReviewSection + GiveReviewComposer
 *
 * Expandable review list: shows a few reviews by default; "See All Reviews"
 * extends the list downwards (animated). A "Give a Review" action at the
 * end reveals a composer whose search bar appears on tap, letting users
 * search existing reviews and submit a new one with a star rating.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, ANIMATION, EASING } from '../constants/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface ReviewItem {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  date?: string;
  content: string;
}

/** Smooth height + opacity expand/collapse (mirrors PropertyDetail pattern). */
const AnimatedCollapsible: React.FC<{ expanded: boolean; children: React.ReactNode }> = ({
  expanded,
  children,
}) => {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: ANIMATION.normal,
      easing: EASING.easeInOut,
      useNativeDriver: false,
    }).start();
  }, [expanded, reducedMotion, progress]);

  return (
    <Animated.View
      style={{
        height: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, contentHeight],
        }),
        opacity: progress,
        overflow: 'hidden',
      }}
    >
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const StarSelector: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((s) => (
      <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
        <Ionicons name={s <= value ? 'star' : 'star-outline'} size={28} color={COLORS.warning} />
      </TouchableOpacity>
    ))}
  </View>
);

/** Default review card when no custom renderItem is provided. */
const DefaultReviewCard: React.FC<{ review: ReviewItem }> = ({ review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewTop}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{(review.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.reviewUser}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <View style={styles.reviewStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < Math.floor(review.rating) ? 'star' : 'star-outline'}
              size={12}
              color={COLORS.warning}
            />
          ))}
        </View>
      </View>
      {review.date ? <Text style={styles.reviewDate}>{review.date}</Text> : null}
    </View>
    <Text style={styles.reviewContent}>{review.content}</Text>
  </View>
);

interface ReviewSectionProps {
  reviews: ReviewItem[];
  /** Number of reviews shown before expanding (default 2). */
  initialCount?: number;
  /** Custom card renderer. */
  renderItem?: (review: ReviewItem) => React.ReactNode;
  /** Shown when there are no reviews. */
  emptyText?: string;
  /** Hide the "Give a Review" flow. */
  allowReview?: boolean;
  /** Called with (rating, content) when a review is submitted. */
  onSubmitReview?: (rating: number, content: string) => void;
  /** Label for the expand control (default "See All Reviews"). */
  seeAllLabel?: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  initialCount = 2,
  renderItem,
  emptyText = 'No reviews yet — be the first to review.',
  allowReview = true,
  onSubmitReview,
  seeAllLabel = 'See All Reviews',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const filtered = filter.trim()
    ? reviews.filter(
        (r) =>
          r.name.toLowerCase().includes(filter.toLowerCase()) ||
          r.content.toLowerCase().includes(filter.toLowerCase())
      )
    : reviews;

  const visible = expanded || filter.trim() ? filtered : filtered.slice(0, initialCount);
  const hasMore = filtered.length > initialCount;
  const renderReview = renderItem || ((r: ReviewItem) => <DefaultReviewCard review={r} />);

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert('Review', 'Please write your review before submitting.');
      return;
    }
    onSubmitReview?.(rating, text.trim());
    setText('');
    setFilter('');
    setRating(5);
    setComposerOpen(false);
    Alert.alert('Thank you!', 'Your review has been submitted successfully.');
  };

  return (
    <View>
      {reviews.length === 0 && !filter.trim() && (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}

      {visible.map((review) => (
        <View key={review.id}>{renderReview(review)}</View>
      ))}

      {hasMore && (
        <TouchableOpacity style={styles.seeAllButton} onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.seeAllText}>{expanded ? 'Show less' : seeAllLabel}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {allowReview && (
        <>
          {!composerOpen ? (
            <TouchableOpacity style={styles.giveReviewButton} onPress={() => setComposerOpen(true)}>
              <Ionicons name="star-outline" size={18} color={COLORS.primary} />
              <Text style={styles.giveReviewText}>Give a Review</Text>
            </TouchableOpacity>
          ) : (
            <AnimatedCollapsible expanded={composerOpen}>
              <View style={styles.composer}>
                {/* Search bar — appears when "Give a Review" is clicked */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color={COLORS.textTertiary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search reviews…"
                    placeholderTextColor={COLORS.textTertiary}
                    value={filter}
                    onChangeText={setFilter}
                  />
                  {filter.length > 0 && (
                    <TouchableOpacity onPress={() => setFilter('')}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.composerLabel}>Rate your experience</Text>
                <StarSelector value={rating} onChange={setRating} />

                <TextInput
                  style={styles.composerInput}
                  placeholder="Write your review…"
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  maxLength={500}
                  value={text}
                  onChangeText={setText}
                />

                <View style={styles.composerActions}>
                  <TouchableOpacity
                    style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]}
                    disabled={!text.trim()}
                    onPress={handleSubmit}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitText}>Submit Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setComposerOpen(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedCollapsible>
          )}
        </>
      )}
    </View>
  );
};

interface GiveReviewComposerProps {
  /** Optional — receives the search query so the parent can filter its list. */
  onSearchChange?: (q: string) => void;
  onSubmitReview: (rating: number, content: string) => void;
}

/** Standalone composer for screens with their own review list. */
export const GiveReviewComposer: React.FC<GiveReviewComposerProps> = ({ onSearchChange, onSubmitReview }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert('Review', 'Please write your review before submitting.');
      return;
    }
    onSubmitReview(rating, text.trim());
    setText('');
    setSearch('');
    setRating(5);
    setOpen(false);
    Alert.alert('Thank you!', 'Your review has been submitted successfully.');
  };

  if (!open) {
    return (
      <TouchableOpacity style={styles.giveReviewButton} onPress={() => setOpen(true)}>
        <Ionicons name="star-outline" size={18} color={COLORS.primary} />
        <Text style={styles.giveReviewText}>Give a Review</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.composer}>
      {/* Search bar — appears when "Give a Review" is clicked */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reviews…"
          placeholderTextColor={COLORS.textTertiary}
          value={search}
          onChangeText={(q) => {
            setSearch(q);
            onSearchChange?.(q);
          }}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); onSearchChange?.(''); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.composerLabel}>Rate your experience</Text>
      <StarSelector value={rating} onChange={setRating} />

      <TextInput
        style={styles.composerInput}
        placeholder="Write your review…"
        placeholderTextColor={COLORS.textTertiary}
        multiline
        maxLength={500}
        value={text}
        onChangeText={setText}
      />

      <View style={styles.composerActions}>
        <TouchableOpacity
          style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]}
          disabled={!text.trim()}
          onPress={handleSubmit}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.submitText}>Submit Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setOpen(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewCard: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewUser: {
    flex: 1,
  },
  reviewName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  reviewContent: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: SPACING.sm,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  giveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
    backgroundColor: 'rgba(255,107,0,0.06)',
  },
  giveReviewText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  composer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  composerLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  composerInput: {
    color: COLORS.text,
    fontSize: 14,
    minHeight: 80,
    maxHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 12,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
