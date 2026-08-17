import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../hooks/useCurrency';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';

type SettingsItem = {
  icon: string;
  label: string;
  color: string;
  type?: 'toggle' | 'link';
  key?: string;
  detail?: string;
  value?: boolean;
  onPress?: () => void;
};

const createSettingsSections = (colors: ThemeColors, navigation?: any): { title: string; items: SettingsItem[] }[] => [
  {
    title: 'Notifications',
    items: [
      { icon: 'home-outline', label: 'Property Alerts', type: 'toggle', color: colors.primary, key: 'propertyAlerts' },
      { icon: 'cart-outline', label: 'Marketplace Updates', type: 'toggle', color: colors.secondary, key: 'marketplaceUpdates' },
      { icon: 'chatbubble-outline', label: 'Message Notifications', type: 'toggle', color: colors.accent, key: 'messageNotifs' },
      { icon: 'megaphone-outline', label: 'Promotions & Deals', type: 'toggle', color: colors.warning, key: 'promotions' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { icon: 'eye-outline', label: 'Show Profile Publicly', type: 'toggle', color: colors.primary, key: 'publicProfile' },
      { icon: 'location-outline', label: 'Share Location', type: 'toggle', color: colors.accent, key: 'shareLocation' },
      { icon: 'lock-closed-outline', label: 'Account Privacy', type: 'link', color: colors.secondary },
      { icon: 'shield-checkmark-outline', label: 'Data & Security', type: 'link', color: colors.primaryLight },
    ],
  },
  {
    title: 'App Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', color: colors.primary, key: 'darkMode', value: true },
      { icon: 'language-outline', label: 'Language', type: 'link', color: colors.accent, detail: 'English' },
      { icon: 'cash-outline', label: 'Currency', type: 'link', color: colors.warning, detail: 'KSh' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', type: 'link', color: colors.primary },
      { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', type: 'link', color: colors.accent },
      { icon: 'document-text-outline', label: 'Terms of Service', type: 'link', color: colors.textSecondary, onPress: () => navigation?.navigate('Legal', { initialPage: 'terms' }) },
      { icon: 'shield-outline', label: 'Privacy Policy', type: 'link', color: colors.textSecondary, onPress: () => navigation?.navigate('PrivacyPolicy' as never) },
      { icon: 'information-circle-outline', label: 'About HAMA', type: 'link', color: colors.textSecondary, onPress: () => navigation?.navigate('About') },
    ],
  },
];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signOut, deleteAccount, exportData, signOutAllDevices } = useAuth();
  const { colors, isDark, toggle: toggleTheme } = useTheme();
  const { currency } = useCurrency();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    propertyAlerts: true,
    marketplaceUpdates: true,
    messageNotifs: true,
    promotions: false,
    publicProfile: true,
    shareLocation: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const sections = useMemo(() => createSettingsSections(colors, navigation), [colors, navigation]);

  const toggleSwitch = (key: string) => {
    if (key === 'darkMode') {
      toggleTheme();
      return;
    }
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /** Confirm and delete account */
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() },
      ],
    );
  }, [deleteAccount]);

  /** Export user data */
  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportData();
      Alert.alert(
        'Data Export',
        'Your data export request has been submitted. You will receive an email with your data shortly.',
      );
    } catch (err: any) {
      Alert.alert('Export Failed', err.message ?? 'Could not export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [exportData]);

  /** Sign out from all devices */
  const handleSignOutAll = useCallback(() => {
    Alert.alert(
      'Sign Out All Devices',
      'This will sign you out from all devices and sessions. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out All', style: 'destructive', onPress: () => signOutAllDevices() },
      ],
    );
  }, [signOutAllDevices]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={19} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.scaledContent}>
        {createSettingsSections(navigation).map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard noPadding>
              {section.items.map((item, ii) => {
                const isCurrency = item.label === 'Currency';
                const detailText = isCurrency ? currency : (item as any).detail;
                return (
                <TouchableOpacity
                  key={ii}
                  style={[
                    styles.settingItem,
                    ii < section.items.length - 1 && styles.settingBorder,
                  ]}
                  onPress={isCurrency ? () => navigation.navigate('CurrencyPicker') : (item as any).onPress}
                  activeOpacity={(item as any).onPress || isCurrency ? 0.7 : 1}
                >
                  <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    {detailText && (
                      <Text style={styles.settingDetail}>{detailText}</Text>
                    )}
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.key === 'darkMode' ? isDark : toggles[(item as any).key]}
                      onValueChange={() => toggleSwitch((item as any).key)}
                      trackColor={{ false: colors.bgCard, true: colors.primary + '60' }}
                      thumbColor={(item.key === 'darkMode' ? isDark : toggles[(item as any).key]) ? colors.primary : colors.textTertiary}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              )})}
            </GlassCard>
          </View>
        ))}

        </View>

        {/* Account Management Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <GlassCard noPadding>
              {/* Export Data */}
              <TouchableOpacity
                style={[styles.settingItem, styles.settingBorder]}
                onPress={handleExportData}
                disabled={isExporting}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="download-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Export My Data</Text>
                  <Text style={styles.settingDetail}>Download all your personal data</Text>
                </View>
                <Ionicons name={isExporting ? 'hourglass-outline' : 'chevron-forward'} size={14} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Sign Out All Devices */}
              <TouchableOpacity
                style={[styles.settingItem, styles.settingBorder]}
                onPress={handleSignOutAll}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.warning} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Sign Out All Devices</Text>
                  <Text style={styles.settingDetail}>Revoke all active sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Delete Account */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.error }]}>Delete Account</Text>
                  <Text style={styles.settingDetail}>Permanently remove your account and data</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Sign Out Button */}
        {isAuthenticated && (
          <View style={styles.signOutSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={16} color={colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <LinearGradient colors={colors.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.appIcon}>
            <Text style={styles.appIconText}>H</Text>
          </LinearGradient>
          <Text style={styles.appName}>HAMA™</Text>
          <Text style={styles.appVersion}>Version 2.1.0</Text>
          <Text style={styles.appTagline}>Need a house homie? We've got you!</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingBottom: 13,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingTop: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 29,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
scrollContent: {
      paddingTop: 13,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
  scaledContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 13,
    marginBottom: 19,
  },
  sectionTitle: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 10,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  settingIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 12,
  },
  settingDetail: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  // Sign Out
  signOutSection: {
    paddingHorizontal: 13,
    marginBottom: 19,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.error + '15',
    borderRadius: RADIUS.full,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.error + '33',
  },
  signOutText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 3,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  appIconText: {
    color: colors.secondary,
    fontSize: 19,
    fontWeight: '800' as const,
  },
  appName: {
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 19,
    color: colors.text,
  },
  appVersion: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  appTagline: {
    color: colors.textTertiary,
    fontSize: 10,
  },
});
