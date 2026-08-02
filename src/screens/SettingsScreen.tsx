import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { EmailCaptureForm } from '../components/EmailCaptureForm';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

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

const createSettingsSections = (navigation?: any): { title: string; items: SettingsItem[] }[] => [
  {
    title: 'Notifications',
    items: [
      { icon: 'home-outline', label: 'Property Alerts', type: 'toggle', color: COLORS.primary, key: 'propertyAlerts' },
      { icon: 'cart-outline', label: 'Marketplace Updates', type: 'toggle', color: COLORS.secondary, key: 'marketplaceUpdates' },
      { icon: 'chatbubble-outline', label: 'Message Notifications', type: 'toggle', color: COLORS.accent, key: 'messageNotifs' },
      { icon: 'megaphone-outline', label: 'Promotions & Deals', type: 'toggle', color: COLORS.warning, key: 'promotions' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { icon: 'eye-outline', label: 'Show Profile Publicly', type: 'toggle', color: COLORS.primary, key: 'publicProfile' },
      { icon: 'location-outline', label: 'Share Location', type: 'toggle', color: COLORS.accent, key: 'shareLocation' },
      { icon: 'lock-closed-outline', label: 'Account Privacy', type: 'link', color: COLORS.secondary },
      { icon: 'shield-checkmark-outline', label: 'Data & Security', type: 'link', color: COLORS.primaryLight },
    ],
  },
  {
    title: 'App Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', color: COLORS.primary, key: 'darkMode', value: true },
      { icon: 'language-outline', label: 'Language', type: 'link', color: COLORS.accent, detail: 'English' },
      { icon: 'cash-outline', label: 'Currency', type: 'link', color: COLORS.warning, detail: 'KSh' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', type: 'link', color: COLORS.primary },
      { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', type: 'link', color: COLORS.accent },
      { icon: 'document-text-outline', label: 'Terms of Service', type: 'link', color: COLORS.textSecondary, onPress: () => navigation?.navigate('Legal', { initialPage: 'terms' }) },
      { icon: 'shield-outline', label: 'Privacy Policy', type: 'link', color: COLORS.textSecondary, onPress: () => navigation?.navigate('PrivacyPolicy' as never) },
    ],
  },
];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signOut, deleteAccount, exportData, signOutAllDevices } = useAuth();
  const { currency } = useCurrency();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    propertyAlerts: true,
    marketplaceUpdates: true,
    messageNotifs: true,
    promotions: false,
    publicProfile: true,
    shareLocation: false,
    darkMode: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleSwitch = (key: string) => {
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
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={19} color={COLORS.text} />
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
                      value={toggles[(item as any).key]}
                      onValueChange={() => toggleSwitch((item as any).key)}
                      trackColor={{ false: COLORS.bgCard, true: COLORS.primary + '60' }}
                      thumbColor={toggles[(item as any).key] ? COLORS.primary : COLORS.textTertiary}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              )})}
            </GlassCard>
          </View>
        ))}

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
                <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Export My Data</Text>
                  <Text style={styles.settingDetail}>Download all your personal data</Text>
                </View>
                <Ionicons name={isExporting ? 'hourglass-outline' : 'chevron-forward'} size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>

              {/* Sign Out All Devices */}
              <TouchableOpacity
                style={[styles.settingItem, styles.settingBorder]}
                onPress={handleSignOutAll}
              >
                <View style={[styles.settingIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="phone-portrait-outline" size={16} color={COLORS.warning} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Sign Out All Devices</Text>
                  <Text style={styles.settingDetail}>Revoke all active sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>

              {/* Delete Account */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.settingIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: COLORS.error }]}>Delete Account</Text>
                  <Text style={styles.settingDetail}>Permanently remove your account and data</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Email Capture */}
        <View style={styles.section}>
          <EmailCaptureForm compact message="Get early access to subscription launch news, feature releases, and exclusive updates." />
        </View>

        {/* Sign Out Button */}
        {isAuthenticated && (
          <View style={styles.signOutSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.appIcon}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 29,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingTop: 13,
  },
  section: {
    paddingHorizontal: 13,
    marginBottom: 19,
  },
  sectionTitle: {
    color: COLORS.textTertiary,
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
    borderBottomColor: COLORS.glassBorder,
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
    color: COLORS.text,
    fontSize: 12,
  },
  settingDetail: {
    color: COLORS.textTertiary,
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
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.full,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
  },
  signOutText: {
    color: COLORS.error,
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
    color: '#fff',
    fontSize: 19,
    fontWeight: '800' as const,
  },
  appName: {
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 19,
    color: COLORS.text,
  },
  appVersion: {
    color: COLORS.textTertiary,
    fontSize: 10,
  },
  appTagline: {
    color: COLORS.textTertiary,
    fontSize: 10,
  },
});
