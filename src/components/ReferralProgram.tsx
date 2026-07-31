/**
 * HAMA™ Referral Program Component
 *
 * Displays the user's referral link, reward tiers, and referral stats.
 * Allows sharing the referral link and tracks analytics.
 *
 * Reward tiers:
 * - 3 Referrals → Early Access Plus
 * - 5 Referrals → Founding Member Gold
 * - 10 Referrals → VIP Founding Circle
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { useAuth } from '../contexts/AuthContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { REFERRAL_TIERS } from '../constants/types';
import { referralService } from '../services/earlyAccessService';
import { trackReferralLinkCopied, trackReferralShared, trackReferralTierViewed } from '../utils/analytics';
import * as Clipboard from 'expo-clipboard';

interface ReferralProgramProps {
  compact?: boolean;
}

export const ReferralProgram: React.FC<ReferralProgramProps> = ({ compact = false }) => {
  const { referralStats, loadReferralStats } = useEarlyAccess();
  const { currentUserId } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUserId && EARLY_ACCESS_CONFIG.REFERRAL.ENABLED) {
      loadReferralStats(currentUserId);
    }
  }, [currentUserId]);

  if (!EARLY_ACCESS_CONFIG.REFERRAL.ENABLED || !referralStats) return null;

  const progressToNext = referralStats.nextTier
    ? Math.min(referralStats.successfulSignups / referralStats.nextTier.requiredReferrals, 1)
    : 1;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(referralStats.referralLink);
      setCopied(true);
      trackReferralLinkCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy link.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join HAMA™ — the all-in-one platform for finding homes, products, and services. Use my referral link: ${referralStats.referralLink}`,
        title: 'Join HAMA™ Early Access',
      });
      trackReferralShared('share_sheet');
    } catch {
      // User cancelled share
    }
  };

  if (compact) {
    return (
      <GlassCard>
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compactIcon}>
              <Ionicons name="gift" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Refer & Earn Rewards</Text>
              <Text style={styles.compactSub}>
                {referralStats.successfulSignups} signups • {referralStats.totalReferrals} referrals
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtnSmall} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassCard>
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.05)', 'rgba(255, 255, 255, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerIcon}>
            <Ionicons name="gift" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <Text style={styles.headerSub}>
            Invite friends to HAMA and unlock exclusive rewards
          </Text>
        </LinearGradient>
      </GlassCard>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
          <Text style={styles.statLabel}>Referrals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{referralStats.successfulSignups}</Text>
          <Text style={styles.statLabel}>Signups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {referralStats.currentTier ? REFERRAL_TIERS.find(t => t.key === referralStats.currentTier)?.label.slice(0, 3) ?? '--' : '--'}
          </Text>
          <Text style={styles.statLabel}>Tier</Text>
        </View>
      </View>

      {/* Referral Link */}
      <GlassCard style={styles.linkCard}>
        <Text style={styles.linkLabel}>Your Referral Link</Text>
        <View style={styles.linkRow}>
          <View style={styles.linkInput}>
            <Text style={styles.linkText} numberOfLines={1}>{referralStats.referralLink}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? COLORS.accent : COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.shareBtnText}>Share Invite Link</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Reward Tiers */}
      <Text style={styles.tiersTitle}>Reward Tiers</Text>
      <GlassCard noPadding>
        {REFERRAL_TIERS.map((tier, index) => {
          const isUnlocked = referralStats.successfulSignups >= tier.requiredReferrals;
          const isNext = !isUnlocked && referralStats.nextTier?.key === tier.key;
          return (
            <TouchableOpacity
              key={tier.key}
              style={[styles.tierItem, index < REFERRAL_TIERS.length - 1 && styles.tierBorder]}
              onPress={() => trackReferralTierViewed(tier.key)}
            >
              <View style={[styles.tierIcon, isUnlocked && styles.tierIconUnlocked]}>
                <Ionicons
                  name={isUnlocked ? 'checkmark-circle' : (tier.icon as any)}
                  size={22}
                  color={isUnlocked ? COLORS.accent : COLORS.textTertiary}
                />
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierName, isUnlocked && styles.tierUnlockedText]}>
                  {tier.label}
                </Text>
                <Text style={styles.tierDesc}>{tier.description}</Text>
                <View style={styles.tierRequirement}>
                  {isUnlocked && <Ionicons name="checkmark" size={13} color={COLORS.accent} />}
                  <Text style={isUnlocked ? styles.tierUnlocked : styles.tierRequirementText}>
                    {isUnlocked ? 'Unlocked' : `${tier.requiredReferrals} referrals needed`}
                  </Text>
                </View>
              </View>
              {isNext && (
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>Next</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </GlassCard>

      {/* Progress Bar */}
      {referralStats.nextTier && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {referralStats.successfulSignups} / {referralStats.nextTier.requiredReferrals} referrals to unlock {referralStats.nextTier.label}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressToNext * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  // Compact
  compactContent: {
    padding: SPACING.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  compactSub: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  shareBtnSmall: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  headerGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 48, height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 2,
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.glassBorder,
  },
  // Link
  linkCard: {
    padding: SPACING.md,
    gap: 10,
  },
  linkLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  linkInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  copyBtn: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Tiers
  tiersTitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: SPACING.xs,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  tierBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  tierIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierIconUnlocked: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  tierUnlockedText: {
    color: COLORS.accent,
  },
  tierDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  tierRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  tierRequirementText: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  tierUnlocked: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  nextBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  nextBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  // Progress
  progressSection: {
    gap: 6,
  },
  progressLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});
