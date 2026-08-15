/**
 * HAMA™ Announcement Center
 *
 * Central hub for all platform announcements:
 * - Platform Updates
 * - New Features
 * - Upcoming Releases
 * - Founder Messages
 * - Community News
 *
 * In production, these would be loaded from a CMS or backend API.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

type AnnouncementCategory = 'all' | 'updates' | 'features' | 'releases' | 'founder' | 'community';

const CATEGORIES: { key: AnnouncementCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'updates', label: 'Updates', icon: 'refresh' },
  { key: 'features', label: 'Features', icon: 'sparkles' },
  { key: 'releases', label: 'Releases', icon: 'rocket' },
  { key: 'founder', label: 'Founder', icon: 'megaphone' },
  { key: 'community', label: 'Community', icon: 'people' },
];

const MOCK_ANNOUNCEMENTS = [
  {
    id: 'a1',
    type: 'updates' as const,
    title: 'Performance Improvements & Bug Fixes',
    excerpt: 'We\'ve optimized dashboard loading times by 40% and fixed several reported issues.',
    date: '2 days ago',
    icon: 'refresh',
    color: COLORS.accent,
  },
  {
    id: 'a2',
    type: 'features' as const,
    title: 'New AI Assistant Features',
    excerpt: 'Homie can now help you with property comparisons, market analysis, and personalized recommendations.',
    date: '5 days ago',
    icon: 'sparkles',
    color: COLORS.primaryLight,
  },
  {
    id: 'a3',
    type: 'releases' as const,
    title: 'Upcoming: Smart Inventory Automation',
    excerpt: 'We\'re building automated inventory tracking for sellers. Join the beta waitlist to get early access.',
    date: '1 week ago',
    icon: 'rocket',
    color: COLORS.secondary,
  },
  {
    id: 'a4',
    type: 'founder' as const,
    title: 'Message from the Founder',
    excerpt: 'Thank you for being part of our Founding Member community. Your feedback is shaping our roadmap.',
    date: '2 weeks ago',
    icon: 'megaphone',
    color: COLORS.warning,
  },
  {
    id: 'a5',
    type: 'community' as const,
    title: 'Community Poll: What should we build next?',
    excerpt: 'Vote on the next big feature. Options include supplier marketplace, AI contract analysis, and more.',
    date: '2 weeks ago',
    icon: 'people',
    color: COLORS.info,
  },
  {
    id: 'a6',
    type: 'updates' as const,
    title: 'Enhanced Search & Filtering',
    excerpt: 'Our search now supports advanced filters, saved searches, and AI-powered recommendations.',
    date: '3 weeks ago',
    icon: 'search',
    color: COLORS.accent,
  },
  {
    id: 'a7',
    type: 'features' as const,
    title: 'Business Analytics Dashboard Launched',
    excerpt: 'Track your sales, inventory, and customer engagement with real-time analytics and reports.',
    date: '1 month ago',
    icon: 'analytics',
    color: COLORS.primaryLight,
  },
  {
    id: 'a8',
    type: 'founder' as const,
    title: 'Founding Member Milestone: 1,000 Users!',
    excerpt: 'We\'ve reached 1,000 Founding Members. Thank you for being part of this incredible journey.',
    date: '1 month ago',
    icon: 'trophy',
    color: COLORS.warning,
  },
];

interface AnnouncementCenterScreenProps {
  navigation?: any;
}

export const AnnouncementCenterScreen: React.FC<AnnouncementCenterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory>('all');

  const filteredAnnouncements = activeCategory === 'all'
    ? MOCK_ANNOUNCEMENTS
    : MOCK_ANNOUNCEMENTS.filter(a => a.type === activeCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>Platform updates, new features, and community news</Text>
      </LinearGradient>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={styles.categoryContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryTab, activeCategory === cat.key && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={activeCategory === cat.key ? '#fff' : COLORS.textTertiary}
            />
            <Text style={[styles.categoryLabel, activeCategory === cat.key && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Announcements List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptyText}>Check back later for updates</Text>
          </View>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <GlassCard key={announcement.id}>
              <View style={styles.announcementRow}>
                <View style={[styles.typeIcon, { backgroundColor: announcement.color + '20' }]}>
                  <Ionicons name={announcement.icon as any} size={20} color={announcement.color} />
                </View>
                <View style={styles.announcementContent}>
                  <View style={styles.announcementHeader}>
                    <View style={[styles.typeChip, { backgroundColor: announcement.color + '20' }]}>
                      <Text style={[styles.typeChipText, { color: announcement.color }]}>
                        {CATEGORIES.find(c => c.key === announcement.type)?.label ?? announcement.type}
                      </Text>
                    </View>
                    <Text style={styles.announcementDate}>{announcement.date}</Text>
                  </View>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementExcerpt}>{announcement.excerpt}</Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}
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
  categoryBar: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  categoryContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
scrollContent: {
      padding: SPACING.md,
      gap: SPACING.md,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  announcementRow: {
    flexDirection: 'row',
    gap: 12,
    padding: SPACING.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  announcementContent: {
    flex: 1,
    gap: 6,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  announcementDate: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  announcementTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  announcementExcerpt: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
