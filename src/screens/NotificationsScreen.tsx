import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationCard } from '../components/NotificationCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getNotifications, markAllAsRead } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../constants/types';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentUserId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      const { data } = await getNotifications(currentUserId);
      if (data) setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();
  }, [currentUserId]);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread.length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread.length} new</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={async () => {
              if (!currentUserId) return;
              await markAllAsRead(currentUserId);
              const { data } = await getNotifications(currentUserId);
              if (data) setNotifications(data);
            }}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.skeletonSection}>
            <SkeletonLoader type="notification" count={6} />
          </View>
        ) : (
          <>
            {/* Unread */}
            {unread.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>New</Text>
                {unread.map((notif) => (
                  <NotificationCard key={notif.id} notification={notif} />
                ))}
              </View>
            )}

            {/* Read */}
            {read.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Earlier</Text>
                {read.map((notif) => (
                  <NotificationCard key={notif.id} notification={notif} />
                ))}
              </View>
            )}

            {notifications.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>We'll let you know when something arrives</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  skeletonSection: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    ...FONTS.h1,
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    alignSelf: 'flex-start',
  },
  markAllText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
});
