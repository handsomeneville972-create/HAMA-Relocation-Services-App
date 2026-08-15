import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../utils/currency';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import type { CurrencyCode } from '../constants/types';

/**
 * All currencies available in the app.
 * Prices are stored in KSh and automatically converted to the selected currency
 * using the exchange rates defined in CURRENCIES.
 */
const ALL_CURRENCIES: { code: CurrencyCode; symbol: string; name: string; active: boolean }[] = [
  { code: 'KSh', symbol: 'KSh', name: 'Kenyan Shilling', active: true },
  { code: 'USD', symbol: '$',    name: 'US Dollar', active: true },
  { code: 'EUR', symbol: '€',    name: 'Euro', active: true },
  { code: 'GBP', symbol: '£',    name: 'British Pound', active: true },
  { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling', active: true },
  { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling', active: true },
];

export const CurrencyPickerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useCurrency();
  const activeCurrency = ALL_CURRENCIES.find(c => c.code === currency)!;

  const handleSelect = (entry: typeof ALL_CURRENCIES[number]) => {
    if (entry.active) {
      setCurrency(entry.code);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Currency</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current selection summary */}
        <View style={styles.currentSection}>
          <LinearGradient colors={['rgba(255,184,77,0.12)', 'rgba(255,184,77,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.currentCard}>
            <View style={styles.currentIcon}>
              <Ionicons name="cash-outline" size={28} color={COLORS.warning} />
            </View>
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>Current Currency</Text>
              <Text style={styles.currentValue}>{activeCurrency.symbol} — {activeCurrency.name}</Text>
            </View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Active</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Currency list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Currency</Text>
          <Text style={styles.sectionSubtitle}>
            Prices are stored in KSh. Switching currency updates how prices are displayed.
          </Text>
          <GlassCard noPadding>
            {ALL_CURRENCIES.map((entry, i) => {
              const isSelected = entry.code === currency;
              return (
                <TouchableOpacity
                  key={entry.code}
                  style={[
                    styles.currencyItem,
                    i < ALL_CURRENCIES.length - 1 && styles.currencyBorder,
                    isSelected && styles.currencyItemSelected,
                  ]}
                  onPress={() => handleSelect(entry)}
                  activeOpacity={0.7}
                >
                  {/* Currency symbol circle */}
                  <View style={[
                    styles.symbolCircle,
                    isSelected && styles.symbolCircleSelected,
                    !entry.active && styles.symbolCircleInactive,
                  ]}>
                    <Text style={[
                      styles.symbolText,
                      isSelected && styles.symbolTextSelected,
                      !entry.active && styles.symbolTextInactive,
                    ]}>{entry.symbol}</Text>
                  </View>

                  {/* Currency name and status */}
                  <View style={styles.currencyInfo}>
                    <Text style={[
                      styles.currencyName,
                      isSelected && styles.currencyNameSelected,
                    ]}>{entry.name}</Text>
                    <Text style={styles.currencyCode}>{entry.code}</Text>
                  </View>

                  {/* Status indicators */}
                  <View style={styles.currencyRight}>
                    {entry.active ? (
                      isSelected ? (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        </View>
                      ) : (
                        <Text style={styles.previewPrice}>{formatPrice(5000, entry.code)}</Text>
                      )
                    ) : (
                      <View style={styles.v2Badge}>
                        <Text style={styles.v2BadgeText}>v2</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        </View>

        {/* Info card */}
        <View style={styles.section}>
          <GlassCard>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                All listings and prices are stored in Kenyan Shillings (KSh). 
                When you switch to another currency, prices are converted using 
                the current exchange rate shown in the preview next to each option.
              </Text>
            </View>
          </GlassCard>
        </View>

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
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
scrollContent: {
      paddingTop: SPACING.md,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
  // Current selection
  currentSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.2)',
    gap: 14,
  },
  currentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,77,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentInfo: {
    flex: 1,
  },
  currentLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: 'rgba(0,212,170,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  currentBadgeText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  // Section
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  // Currency items
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 14,
  },
  currencyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  currencyItemSelected: {
    backgroundColor: 'rgba(255,107,0,0.06)',
  },
  symbolCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  symbolCircleSelected: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    borderColor: COLORS.primary,
  },
  symbolCircleInactive: {
    opacity: 0.5,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  symbolTextSelected: {
    color: COLORS.primary,
  },
  symbolTextInactive: {
    color: COLORS.textTertiary,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  currencyNameSelected: {
    color: COLORS.primary,
  },
  currencyCode: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  currencyRight: {
    alignItems: 'flex-end',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPrice: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  v2Badge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  v2BadgeText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Info
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
