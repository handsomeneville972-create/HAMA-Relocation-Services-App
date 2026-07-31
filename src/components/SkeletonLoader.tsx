import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'banner' | 'circle' | 'detail-hero' | 'detail-section' | 'post' | 'notification' | 'pricing-card' | 'storefront-card' | 'profile-header' | 'chat' | 'text' | 'liquid-card';
  count?: number;
  width?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1, width, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const ShimmerBlock = ({ style }: { style: any }) => (
    <View style={[styles.block, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7],
            }),
          },
        ]}
      />
    </View>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return <ShimmerBlock style={[styles.textLine, style]} />;
      case 'liquid-card':
        return <ShimmerBlock style={[styles.liquidCard, style]} />;
      case 'card':
        return (
          <View style={styles.card}>
            <ShimmerBlock style={styles.cardImage} />
            <View style={styles.cardContent}>
              <ShimmerBlock style={styles.titleLine} />
              <ShimmerBlock style={styles.priceLine} />
              <ShimmerBlock style={styles.metaLine} />
            </View>
          </View>
        );
      case 'list':
        return (
          <View style={styles.listItem}>
            <ShimmerBlock style={styles.listIcon} />
            <View style={styles.listContent}>
              <ShimmerBlock style={styles.listTitle} />
              <ShimmerBlock style={styles.listSubtitle} />
            </View>
          </View>
        );
      case 'banner':
        return <ShimmerBlock style={[styles.banner, width ? { width } : null]} />;
      case 'circle':
        return <ShimmerBlock style={styles.circle} />;
      case 'detail-hero':
        return (
          <View>
            <ShimmerBlock style={styles.detailHero} />
            <View style={styles.detailHeroContent}>
              <ShimmerBlock style={styles.detailTitle} />
              <ShimmerBlock style={styles.detailPrice} />
              <View style={styles.detailMetaRow}>
                <ShimmerBlock style={styles.detailMeta} />
                <ShimmerBlock style={styles.detailMeta} />
                <ShimmerBlock style={styles.detailMeta} />
              </View>
            </View>
          </View>
        );
      case 'detail-section':
        return (
          <View style={styles.detailSection}>
            <ShimmerBlock style={styles.detailSectionTitle} />
            <ShimmerBlock style={styles.detailSectionLine} />
            <ShimmerBlock style={[styles.detailSectionLine, { width: '80%' }]} />
            <ShimmerBlock style={[styles.detailSectionLine, { width: '60%' }]} />
          </View>
        );
      case 'post':
        return (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <ShimmerBlock style={styles.postAvatar} />
              <View style={styles.postHeaderContent}>
                <ShimmerBlock style={styles.postName} />
                <ShimmerBlock style={styles.postTime} />
              </View>
            </View>
            <ShimmerBlock style={styles.postLine} />
            <ShimmerBlock style={[styles.postLine, { width: '85%' }]} />
            <ShimmerBlock style={[styles.postLine, { width: '70%' }]} />
            <ShimmerBlock style={styles.postImage} />
          </View>
        );
      case 'notification':
        return (
          <View style={styles.notifContainer}>
            <ShimmerBlock style={styles.notifIcon} />
            <View style={styles.notifContent}>
              <View style={styles.notifTopRow}>
                <ShimmerBlock style={styles.notifTitle} />
                <ShimmerBlock style={styles.notifTime} />
              </View>
              <ShimmerBlock style={styles.notifDesc} />
            </View>
          </View>
        );
      case 'pricing-card':
        return (
          <View style={[styles.pricingCard, width ? { width } : null]}>
            <ShimmerBlock style={styles.pricingBadge} />
            <ShimmerBlock style={styles.pricingName} />
            <ShimmerBlock style={styles.pricingPrice} />
            <ShimmerBlock style={styles.pricingPeriod} />
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} style={styles.pricingFeature} />
            ))}
            <ShimmerBlock style={styles.pricingButton} />
          </View>
        );
      case 'storefront-card':
        return (
          <View style={styles.storefrontCard}>
            <ShimmerBlock style={styles.storefrontLogo} />
            <View style={styles.storefrontInfo}>
              <ShimmerBlock style={styles.storefrontName} />
              <ShimmerBlock style={styles.storefrontMeta} />
            </View>
            <ShimmerBlock style={styles.storefrontStat} />
          </View>
        );
      case 'profile-header':
        return (
          <View style={styles.profileHeaderContainer}>
            <View style={styles.profileHeaderRow}>
              <ShimmerBlock style={styles.profileAvatar} />
              <View style={styles.profileTextArea}>
                <ShimmerBlock style={styles.profileName} />
                <ShimmerBlock style={styles.profileEmail} />
                <ShimmerBlock style={styles.profileBadge} />
              </View>
            </View>
            <View style={styles.profileStatsRow}>
              <ShimmerBlock style={styles.profileStat} />
              <ShimmerBlock style={styles.profileStat} />
              <ShimmerBlock style={styles.profileStat} />
            </View>
          </View>
        );
      case 'chat':
        return (
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <ShimmerBlock style={styles.chatBackBtn} />
              <ShimmerBlock style={styles.chatAvatar} />
              <View style={styles.chatHeaderInfo}>
                <ShimmerBlock style={styles.chatName} />
                <ShimmerBlock style={styles.chatStatus} />
              </View>
              <ShimmerBlock style={styles.chatCallBtn} />
            </View>

            {/* Messages area */}
            <View style={styles.chatBody}>
              {/* Date separator */}
              <View style={styles.chatDateSep}>
                <ShimmerBlock style={styles.chatDateLine} />
                <ShimmerBlock style={styles.chatDateText} />
                <ShimmerBlock style={styles.chatDateLine} />
              </View>

              {/* Other's message */}
              <View style={styles.chatMsgRow}>
                <ShimmerBlock style={styles.chatMsgAvatar} />
                <ShimmerBlock style={styles.chatBubbleOther} />
              </View>

              {/* Own message */}
              <View style={[styles.chatMsgRow, styles.chatMsgOwn]}>
                <ShimmerBlock style={styles.chatBubbleOwn} />
              </View>

              {/* Other's message */}
              <View style={styles.chatMsgRow}>
                <ShimmerBlock style={styles.chatMsgAvatar} />
                <ShimmerBlock style={styles.chatBubbleOther2} />
              </View>

              {/* Own message */}
              <View style={[styles.chatMsgRow, styles.chatMsgOwn]}>
                <ShimmerBlock style={styles.chatBubbleOwn2} />
              </View>
            </View>

            {/* Input bar */}
            <View style={styles.chatInputBar}>
              <ShimmerBlock style={styles.chatAttachBtn} />
              <ShimmerBlock style={styles.chatInputField} />
              <ShimmerBlock style={styles.chatSendBtn} />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{renderSkeleton()}</View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  block: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  textLine: {
    height: 16,
    width: '100%',
  },
  liquidCard: {
    minHeight: 100,
    width: '100%',
    borderRadius: RADIUS.lg,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgElevated,
  },
  // Card skeleton
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    marginBottom: SPACING.md,
  },
  cardImage: {
    height: 160,
    borderRadius: 0,
  },
  cardContent: {
    padding: SPACING.sm,
    gap: 8,
  },
  titleLine: {
    height: 14,
    width: '80%',
  },
  priceLine: {
    height: 18,
    width: '50%',
  },
  metaLine: {
    height: 12,
    width: '60%',
  },
  // List skeleton
  listItem: {
    flexDirection: 'row',
    gap: 12,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  listContent: {
    flex: 1,
    gap: 8,
  },
  listTitle: {
    height: 14,
    width: '60%',
  },
  listSubtitle: {
    height: 12,
    width: '40%',
  },
  // Banner skeleton
  banner: {
    height: 200,
    width: '100%',
    borderRadius: RADIUS.lg,
  },
  // Circle skeleton
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  // Detail hero skeleton
  detailHero: {
    height: 300,
    width: '100%',
    borderRadius: 0,
  },
  detailHeroContent: {
    padding: SPACING.md,
    marginTop: -SPACING.xl,
    gap: 8,
  },
  detailTitle: {
    height: 24,
    width: '75%',
  },
  detailPrice: {
    height: 28,
    width: '40%',
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailMeta: {
    height: 16,
    width: 80,
  },
  // Detail section skeleton
  detailSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginBottom: SPACING.md,
  },
  detailSectionTitle: {
    height: 18,
    width: '40%',
    marginBottom: 4,
  },
  detailSectionLine: {
    height: 12,
    width: '100%',
  },
  // Post skeleton
  postContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    gap: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postHeaderContent: {
    flex: 1,
    gap: 4,
  },
  postName: {
    height: 14,
    width: '50%',
  },
  postTime: {
    height: 10,
    width: '30%',
  },
  postLine: {
    height: 12,
    width: '100%',
  },
  postImage: {
    height: 180,
    width: '100%',
    marginTop: 4,
  },
  // Notification skeleton
  notifContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notifContent: {
    flex: 1,
    gap: 6,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notifTitle: {
    height: 14,
    width: '60%',
  },
  notifTime: {
    height: 10,
    width: 50,
  },
  notifDesc: {
    height: 12,
    width: '85%',
  },
  // Pricing card skeleton
  pricingCard: {
    width: 280,
    padding: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    gap: 10,
    marginRight: SPACING.md,
  },
  pricingBadge: {
    height: 24,
    width: 80,
    borderRadius: RADIUS.full,
  },
  pricingName: {
    height: 20,
    width: '60%',
  },
  pricingPrice: {
    height: 32,
    width: '50%',
  },
  pricingPeriod: {
    height: 14,
    width: '40%',
  },
  pricingFeature: {
    height: 14,
    width: '100%',
  },
  pricingButton: {
    height: 44,
    width: '100%',
    marginTop: 8,
  },
  // Storefront skeleton
  storefrontCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  storefrontLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  storefrontInfo: {
    flex: 1,
    gap: 6,
  },
  storefrontName: {
    height: 16,
    width: '50%',
  },
  storefrontMeta: {
    height: 12,
    width: '60%',
  },
  storefrontStat: {
    width: 60,
    height: 36,
  },
  // Chat skeleton
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 12,
    backgroundColor: COLORS.bgCard,
    paddingBottom: 14,
  },
  chatBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  chatName: {
    height: 16,
    width: '50%',
  },
  chatStatus: {
    height: 12,
    width: '30%',
  },
  chatCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatBody: {
    flex: 1,
    padding: SPACING.md,
    gap: 16,
  },
  chatDateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chatDateLine: {
    flex: 1,
    height: 1,
  },
  chatDateText: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  chatMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatMsgOwn: {
    justifyContent: 'flex-end',
  },
  chatMsgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  chatBubbleOther: {
    width: '65%',
    height: 48,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  chatBubbleOwn: {
    width: '55%',
    height: 36,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  chatBubbleOther2: {
    width: '45%',
    height: 56,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  chatBubbleOwn2: {
    width: '70%',
    height: 42,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  chatAttachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chatInputField: {
    flex: 1,
    height: 40,
    borderRadius: 20,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Profile header skeleton
  profileHeaderContainer: {
    gap: SPACING.lg,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileTextArea: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    height: 22,
    width: '60%',
  },
  profileEmail: {
    height: 14,
    width: '75%',
  },
  profileBadge: {
    height: 24,
    width: 80,
    borderRadius: RADIUS.full,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileStat: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
  },
});
