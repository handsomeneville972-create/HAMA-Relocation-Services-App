import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, Dimensions, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { StaggerItem } from '../components/StaggerItem';
import { ReviewSection } from '../components/ReviewSection';
import { getPropertyById, getPropertyReviews } from '../services/propertyService';
import { findOrCreateConversation } from '../services/conversationService';
import { useAuth } from '../contexts/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, ANIMATION, EASING } from '../constants/theme';
import { formatPrice } from '../utils/currency';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Property, PropertyReview } from '../constants/types';

const { width } = Dimensions.get('window');

const QUICK_QUESTIONS = [
  'Is this property still available?',
  'Can I schedule a viewing?',
  'Is the rent negotiable?',
  'Is parking available?',
  'Are utilities included?',
];

const REPORT_REASONS = [
  'Scam',
  'Incorrect Information',
  'Duplicate Listing',
  'Suspicious Activity',
];

const ActionButton: React.FC<{
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress?: () => void;
}> = ({ icon, label, variant = 'outline', onPress }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        actionBtnStyles.button,
        isPrimary && actionBtnStyles.primaryButton,
        variant === 'outline' && actionBtnStyles.outlineButton,
      ]}
    >
      <LinearGradient
        colors={isPrimary ? [COLORS.primary, COLORS.primaryLight] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={actionBtnStyles.gradient}
      >
        <View style={[actionBtnStyles.iconBox, isPrimary && actionBtnStyles.primaryIconBox]}>
          <Ionicons name={icon as any} size={18} color={isPrimary ? '#fff' : COLORS.primaryLight} />
        </View>
        <Text style={[actionBtnStyles.label, isPrimary && actionBtnStyles.primaryLabel]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const actionBtnStyles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  primaryButton: {
    borderColor: COLORS.primary,
    borderWidth: 0,
  },
  outlineButton: {
    backgroundColor: COLORS.bgCard,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  primaryLabel: {
    color: '#fff',
  },
});

// Smooth height + opacity expand/collapse. Uses non-native driver for height,
// keeps opacity on the native driver. Honors reduced-motion by snapping.
const AnimatedCollapsible: React.FC<{
  expanded: boolean;
  children: React.ReactNode;
}> = ({ expanded, children }) => {
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

export const PropertyDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { propertyId } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUserId } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const [propRes, revRes] = await Promise.all([
        getPropertyById(propertyId),
        getPropertyReviews(propertyId),
      ]);
      if (propRes.data) setProperty(propRes.data);
      if (revRes.data) setReviews(revRes.data);
      setLoading(false);
    };
    fetchData();
  }, [propertyId]);

  if (!property) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonLoader type="detail-hero" />
          <View style={styles.content}>
            <SkeletonLoader type="detail-section" count={4} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 250],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-50, 0, 200],
    outputRange: [1.1, 1, 0.95],
    extrapolate: 'clamp',
  });

  const handleAction = async (action: string) => {
    if (action === 'Chat with Landlord' || action === 'Chat') {
      if (!property?.landlord?.id) {
        Alert.alert('Error', 'Landlord information not available.');
        return;
      }
      if (!currentUserId) {
        Alert.alert('Error', 'Please log in to chat with the landlord.');
        return;
      }
      const { data, error } = await findOrCreateConversation(currentUserId, property.landlord.id, { propertyId: property.id });
      if (data) {
        navigation.navigate('Chat', { conversationId: data.conversationId });
      } else {
        Alert.alert('Error', 'Could not start conversation. Please try again.');
      }
    } else {
      Alert.alert(action, 'Coming soon.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ===== HERO GALLERY ===== */}
        <Animated.View style={[styles.imageContainer, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
          <Image source={{ uri: property.images?.[0] ?? 'https://placehold.co/800x600/1a1a1a/666?text=No+Image' }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', COLORS.bg]} style={styles.imageGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </TouchableOpacity>
          {/* Gallery dots */}
          <View style={styles.galleryDots}>
            {property.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.activeDot]} />
            ))}
          </View>
          {/* Availability badge */}
          <View style={[styles.availBadge, property.available ? styles.availAvailable : styles.availUnavailable]}>
            <Text style={styles.availText}>{property.available ? 'Available' : 'Rented'}</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* ===== PROPERTY INFO ===== */}
          <GlassCard>
            <View style={styles.propertyHeader}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(property.price)}</Text>
                <Text style={styles.perMonth}>/month</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="bed-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{property.bedrooms} Bed</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="water-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{property.bathrooms} Bath</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="expand-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{property.size} m²</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.locationText}>{property.location}</Text>
            </View>

            <Text style={styles.description}>{property.description}</Text>

            {/* Amenities */}
            <Text style={styles.sectionLabel}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity, i) => (
                <StaggerItem key={i} index={i} style={styles.amenityTag}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </StaggerItem>
              ))}
              {property.furnished && (
                <StaggerItem
                  index={property.amenities.length}
                  style={styles.amenityTag}
                >
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={styles.amenityText}>Furnished</Text>
                </StaggerItem>
              )}
            </View>
          </GlassCard>

          {/* ===== LANDLORD PROFILE ===== */}
          <GlassCard>
            <Text style={styles.sectionTitle}>Landlord</Text>
            <View style={styles.landlordHeader}>
              <Image source={{ uri: property.landlord.avatar }} style={styles.landlordAvatar} />
              <View style={styles.landlordInfo}>
                <View style={styles.landlordNameRow}>
                  <Text style={styles.landlordName}>{property.landlord.name}</Text>
                  {property.landlord.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.landlordMeta}>
                  Response Rate: {property.landlord.responseRate} • Avg: 15 min
                </Text>
                <Text style={styles.landlordMeta}>
                  {property.landlord.properties} Properties Listed • 2 years on HAMA
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* ===== PRIMARY CONTACT ACTIONS ===== */}
          <GlassCard>
            <Text style={styles.sectionTitle}>Contact Options</Text>
            <View style={styles.primaryActions}>
              <ActionButton icon="chatbubble-ellipses" label="Chat" variant="primary" onPress={() => handleAction('Chat with Landlord')} />
              <ActionButton icon="call" label="Call Now" onPress={() => handleAction('Call Landlord')} />
              <ActionButton icon="logo-whatsapp" label="WhatsApp" onPress={() => handleAction('WhatsApp Landlord')} />
            </View>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              <ActionButton icon="calendar-outline" label="Schedule Viewing" onPress={() => handleAction('Schedule Viewing')} />
              <ActionButton icon="videocam-outline" label="Virtual Tour" onPress={() => handleAction('Request Virtual Tour')} />
            </View>

            {/* Booking Options */}
            <View style={styles.secondaryActions}>
              <ActionButton icon="bookmark-outline" label="Reserve Interest" onPress={() => handleAction('Reserve Interest')} />
              <ActionButton icon="document-text-outline" label="Pre-Book Unit" onPress={() => handleAction('Pre-Book Unit')} />
            </View>

            {/* Relocation Support */}
            <Text style={styles.sectionLabel}>Relocation Support</Text>
            <View style={styles.secondaryActions}>
              <ActionButton icon="car-outline" label="Estimate Moving Cost" onPress={() => handleAction('Estimate Moving Cost')} />
              <ActionButton icon="truck" label="Move Here" onPress={() => handleAction('Move with Hamisha Squad')} />
            </View>
          </GlassCard>

          {/* ===== QUICK QUESTIONS ===== */}
          <GlassCard>
            <TouchableOpacity
              style={styles.questionsHeader}
              onPress={() => setShowQuestions(!showQuestions)}
            >
              <Text style={styles.sectionTitle}>Quick Questions</Text>
              <Ionicons
                name={showQuestions ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <AnimatedCollapsible expanded={showQuestions}>
              <View style={styles.questionsList}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.questionItem}
                    onPress={() => handleAction(`Ask: ${q}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.questionText}>{q}</Text>
                    <Ionicons name="send" size={14} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedCollapsible>
          </GlassCard>

          {/* ===== TRUST & SAFETY ===== */}
          <GlassCard>
            <Text style={styles.sectionTitle}>Trust & Safety</Text>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                <Text style={styles.trustText}>Verified Listing</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="time" size={20} color={COLORS.warning} />
                <Text style={styles.trustText}>Listed 3 days ago</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setShowReport(!showReport)}
            >
              <Ionicons name="flag-outline" size={18} color={COLORS.error} />
              <Text style={styles.reportText}>Report Listing</Text>
              <Ionicons name={showReport ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.error} />
            </TouchableOpacity>
            <AnimatedCollapsible expanded={showReport}>
              <View style={styles.reportList}>
                {REPORT_REASONS.map((reason, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.reportItem}
                    onPress={() => handleAction(`Report: ${reason}`)}
                  >
                    <Text style={styles.reportItemText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedCollapsible>
            <TouchableOpacity style={styles.blockButton}>
              <Ionicons name="ban-outline" size={18} color={COLORS.textTertiary} />
              <Text style={styles.blockText}>Block Contact</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* ===== REVIEWS ===== */}
          <GlassCard>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Text style={styles.reviewCount}>({property.reviewCount})</Text>
            </View>
            <View style={styles.ratingOverview}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingBigText}>{property.rating}</Text>
                <Text style={styles.ratingMax}>/5</Text>
              </View>
              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2;
                  return (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{star}</Text>
                      <View style={styles.ratingBarBg}>
                        <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            <ReviewSection
              reviews={reviews.map(r => ({
                id: r.id,
                name: r.user?.name || 'User',
                avatar: r.user?.avatar,
                rating: r.rating,
                date: r.createdAt,
                content: r.content,
              }))}
              emptyText="No reviews yet — be the first to review this property."
              onSubmitReview={(rating, content) => {
                setReviews(prev => [
                  {
                    id: `local-${Date.now()}`,
                    propertyId,
                    user: {
                      id: 'local-you',
                      name: 'You',
                      email: 'you@hama.app',
                      emailVerified: true,
                      phoneVerified: true,
                      avatar: '',
                      role: 'seeker',
                      verified: false,
                      verificationLevel: 'email',
                      joinDate: new Date().toISOString(),
                    },
                    rating,
                    security: rating,
                    cleanliness: rating,
                    accessibility: rating,
                    amenities: rating,
                    valueForMoney: rating,
                    content,
                    createdAt: 'Just now',
                    helpful: 0,
                  },
                  ...prev,
                ]);
              }}
              renderItem={(review) => (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    {review.avatar ? (
                      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={styles.reviewAvatarFallback}>
                        <Text style={styles.reviewAvatarFallbackText}>{review.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
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
              )}
            />
          </GlassCard>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Hero
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryDots: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  availBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  availAvailable: {
    backgroundColor: 'rgba(0,212,170,0.2)',
  },
  availUnavailable: {
    backgroundColor: 'rgba(255,77,106,0.2)',
  },
  availText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
    marginTop: -SPACING.xl,
    gap: SPACING.md,
  },
  // Property Info
  propertyHeader: {
    marginBottom: SPACING.sm,
  },
  propertyTitle: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.accent,
  },
  perMonth: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.glassBorder,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  locationText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,212,170,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  amenityText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  // Landlord
  landlordHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  landlordInfo: {
    flex: 1,
  },
  landlordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  landlordName: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  verifiedText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  landlordMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // Contact Actions
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  // Quick Questions
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionsList: {
    gap: 4,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  questionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  // Trust & Safety
  trustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: SPACING.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    marginBottom: 0,
  },
  reportText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  reportList: {
    gap: 2,
    marginBottom: SPACING.sm,
  },
  reportItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    marginBottom: 2,
  },
  reportItemText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  blockText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  // Reviews
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewCount: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  ratingOverview: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingBigText: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingMax: {
    color: COLORS.textTertiary,
    fontSize: 16,
  },
  ratingBars: {
    flex: 1,
    gap: 3,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    width: 12,
  },
  ratingBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 3,
  },
  reviewCard: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarFallbackText: {
    color: COLORS.primary,
    fontSize: 13,
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
    lineHeight: 18,
  },
  allReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  allReviewsText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
