/**
 * HAMA™ What's New / Changelog Screen
 *
 * Displays the latest platform improvements and version history.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const VERSION_HISTORY = [
  {
    version: '1.2',
    date: 'June 2024',
    changes: [
      { type: 'improvement', text: 'New AI Assistant Improvements — faster responses, better context understanding' },
      { type: 'improvement', text: 'Faster Dashboard Loading — optimized data fetching and caching' },
      { type: 'feature', text: 'Enhanced Reporting — new analytics views and export options' },
      { type: 'improvement', text: 'Improved Mobile Experience — smoother navigation, better touch targets' },
      { type: 'feature', text: 'Advanced AI Forecasting — predictive analytics for business growth' },
    ],
  },
  {
    version: '1.1',
    date: 'May 2024',
    changes: [
      { type: 'feature', text: 'Smart Inventory Automation — automatic stock management' },
      { type: 'feature', text: 'Business Analytics Dashboard — real-time business insights' },
      { type: 'improvement', text: 'Enhanced Search — better filtering and recommendations' },
      { type: 'feature', text: 'Customer Engagement Tools — email campaigns and notifications' },
      { type: 'fix', text: 'Performance optimizations across the platform' },
    ],
  },
  {
    version: '1.0',
    date: 'April 2024',
    changes: [
      { type: 'feature', text: 'HAMA™ Platform Launch — Early Access Program begins' },
      { type: 'feature', text: 'Marketplace — buy and sell products' },
      { type: 'feature', text: 'Services — connect with service providers' },
      { type: 'feature', text: 'Properties — find your perfect home' },
      { type: 'feature', text: 'Community — connect with neighbors' },
      { type: 'feature', text: 'AI Assistant — Homie, your house homie' },
    ],
  },
];

const CHIP_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  feature: { label: 'New', color: COLORS.accent, bg: 'rgba(0, 212, 170, 0.15)' },
  improvement: { label: 'Improved', color: COLORS.primaryLight, bg: 'rgba(255, 107, 0, 0.15)' },
  fix: { label: 'Fixed', color: COLORS.warning, bg: 'rgba(255, 184, 77, 0.15)' },
};

interface WhatsNewScreenProps {
  navigation?: any;
}

export const WhatsNewScreen: React.FC<WhatsNewScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What's New</Text>
        <Text style={styles.headerSubtitle}>Latest platform improvements and updates</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Version Banner */}
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.currentVersionBanner}
        >
          <View style={styles.versionChip}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            <Text style={styles.versionChipText}>v{VERSION_HISTORY[0].version}</Text>
          </View>
          <Text style={styles.currentVersionTitle}>What's New in HAMA™</Text>
          <Text style={styles.currentVersionDate}>Released {VERSION_HISTORY[0].date}</Text>
        </LinearGradient>

        {/* Version History */}
        {VERSION_HISTORY.map((version, index) => (
          <GlassCard key={version.version} style={styles.versionCard}>
            <View style={styles.versionHeader}>
              <Text style={styles.versionTitle}>Version {version.version}</Text>
              <Text style={styles.versionDate}>{version.date}</Text>
            </View>
            <View style={styles.changesList}>
              {version.changes.map((change, ci) => {
                const chip = CHIP_CONFIG[change.type] || CHIP_CONFIG.feature;
                return (
                  <View key={ci} style={styles.changeRow}>
                    <View style={[styles.changeChip, { backgroundColor: chip.bg }]}>
                      <Text style={[styles.changeChipText, { color: chip.color }]}>{chip.label}</Text>
                    </View>
                    <Text style={styles.changeText}>{change.text}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        ))}

        {/* Product Roadmap Preview */}
        <GlassCard style={styles.roadmapCard}>
          <Text style={styles.roadmapTitle}>Product Roadmap</Text>
          <Text style={styles.roadmapDesc}>See what we're building next</Text>
          <View style={styles.roadmapCategories}>
            {[
              { status: 'Planned', color: COLORS.primary, examples: 'Advanced AI Forecasting' },
              { status: 'In Development', color: COLORS.warning, examples: 'Smart Inventory Automation' },
              { status: 'Testing', color: COLORS.info, examples: 'Business Analytics Dashboard' },
              { status: 'Released', color: COLORS.success, examples: 'AI Assistant, Marketplace' },
            ].map((cat, i) => (
              <View key={i} style={styles.roadmapRow}>
                <View style={[styles.roadmapDot, { backgroundColor: cat.color }]} />
                <View style={styles.roadmapInfo}>
                  <Text style={styles.roadmapStatus}>{cat.status}</Text>
                  <Text style={styles.roadmapExamples}>{cat.examples}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  currentVersionBanner: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 8,
  },
  versionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  versionChipText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  currentVersionTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  currentVersionDate: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  versionCard: {
    marginBottom: 0,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  versionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  versionDate: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  changesList: {
    gap: 10,
  },
  changeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  changeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginTop: 1,
  },
  changeChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  changeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roadmapCard: {
    gap: 0,
  },
  roadmapTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  roadmapDesc: {
    color: COLORS.textTertiary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  roadmapCategories: {
    gap: 12,
  },
  roadmapRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  roadmapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roadmapInfo: {
    flex: 1,
  },
  roadmapStatus: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  roadmapExamples: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
});
