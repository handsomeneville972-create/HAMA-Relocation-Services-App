import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../constants/types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, ANIMATION, EASING } from '../constants/theme';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  onFavourite?: () => void;
  isFavourited?: boolean;
  style?: any;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onFavourite,
  isFavourited = false,
  style,
}) => {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION.normal,
        easing: EASING.easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion, fadeAnim, scaleAnim]);

  const handlePressIn = () => {
    if (!reducedMotion) {
      Animated.spring(liftAnim, {
        toValue: -4,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
    Animated.spring(pressAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(liftAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
    Animated.spring(pressAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  const imageUrl = property.images?.[0] ?? 'https://placehold.co/400x300/181818/666?text=No+Image';
  const photoCount = property.images?.length ?? 0;

  const formatPrice = (price: number) => {
    return 'KSh ' + price.toLocaleString();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              scale: pressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.97],
              }),
            },
            { translateY: liftAnim },
          ],
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={styles.cardInner}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Favourite Button */}
            <TouchableOpacity
              style={styles.favouriteButton}
              onPress={onFavourite}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavourited ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavourited ? COLORS.error : '#fff'}
              />
            </TouchableOpacity>

            {/* Photo Count Badge */}
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={styles.photoCountText}>{photoCount}</Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            {/* Featured Badge */}
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {property.title}
            </Text>

            {/* Location */}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.location} numberOfLines={1}>
                {property.location}
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(property.price)}</Text>
              <Text style={styles.priceUnit}>/ month</Text>
            </View>

            {/* Property Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="resize-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{property.size} m²</Text>
              </View>
            </View>

            {/* Instant Booking Badge */}
            <View style={styles.instantBookingBadge}>
              <Ionicons name="flash" size={12} color={COLORS.success} />
              <Text style={styles.instantBookingText}>Instant Booking</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  touchable: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'column',
    backgroundColor: '#181818',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  // Image
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favouriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Info
  infoContainer: {
    flex: 1,
    padding: SPACING.md,
    gap: 4,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  featuredBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  price: {
    ...FONTS.price,
    color: COLORS.text,
  },
  priceUnit: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  detailDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  instantBookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  instantBookingText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '600',
  },
});
