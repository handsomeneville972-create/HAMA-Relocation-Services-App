import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { MOCK_PAYMENT_METHODS, MOCK_BILLING_HISTORY } from '../constants/data';
import { formatPrice } from '../utils/currency';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import type { SavedPaymentMethod, BillingEntry } from '../constants/types';

type Tab = 'cards' | 'history';

const CARD_BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#2E77BC',
  discover: '#FF6000',
};

function getStatusColor(status: BillingEntry['status']): string {
  switch (status) {
    case 'paid':
      return COLORS.success;
    case 'pending':
      return COLORS.warning;
    case 'failed':
      return COLORS.error;
    case 'refunded':
      return COLORS.info;
  }
}

function getMethodLabel(method: BillingEntry['paymentMethod']): string {
  switch (method) {
    case 'mpesa':
      return 'M-Pesa';
    case 'card':
      return 'Card';
    case 'paystack':
      return 'Paystack';
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const PaymentMethodsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [billingHistory] = useState<BillingEntry[]>(MOCK_BILLING_HISTORY);

  const sortedBilling = useMemo(
    () => [...billingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [billingHistory]
  );

  /** Remove a saved payment method */
  const handleRemoveMethod = (method: SavedPaymentMethod) => {
    Alert.alert(
      'Remove Card',
      `Remove ${method.brand} ending in ${method.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
          },
        },
      ]
    );
  };

  /** Set a method as default */
  const handleSetDefault = (method: SavedPaymentMethod) => {
    setPaymentMethods(prev =>
      prev.map(m => ({
        ...m,
        isDefault: m.id === method.id,
      }))
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000000', '#0A0A0A']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Payment Methods</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cards' && styles.tabActive]}
          onPress={() => setActiveTab('cards')}
        >
          <Ionicons
            name="card-outline"
            size={18}
            color={activeTab === 'cards' ? COLORS.primary : COLORS.textTertiary}
          />
          <Text style={[styles.tabLabel, activeTab === 'cards' && styles.tabLabelActive]}>
            Saved Cards
          </Text>
          <View style={[styles.tabBadge, activeTab === 'cards' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'cards' && styles.tabBadgeTextActive]}>
              {paymentMethods.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'history' ? COLORS.primary : COLORS.textTertiary}
          />
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
            Billing History
          </Text>
          <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'history' && styles.tabBadgeTextActive]}>
              {sortedBilling.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ===== SAVED CARDS TAB ===== */}
        {activeTab === 'cards' && (
          <>
            {paymentMethods.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={56} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No Saved Cards</Text>
                <Text style={styles.emptyDesc}>
                  Add a card to pay faster with Paystack
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Cards</Text>
                <GlassCard noPadding>
                  {paymentMethods.map((method, index) => {
                    const brandColor = CARD_BRAND_COLORS[method.brand] ?? CARD_BRAND_COLORS.visa;
                    return (
                      <View
                        key={method.id}
                        style={[
                          styles.cardItem,
                          index < paymentMethods.length - 1 && styles.cardItemBorder,
                        ]}
                      >
                        {/* Card Brand Icon */}
                        <LinearGradient
                          colors={[brandColor, brandColor + '88']}
                          style={styles.cardBrandIcon}
                        >
                          <Ionicons name="card-outline" size={20} color="#fff" />
                        </LinearGradient>

                        {/* Card Info */}
                        <View style={styles.cardInfo}>
                          <View style={styles.cardInfoRow}>
                            <Text style={styles.cardBrand}>
                              {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}
                            </Text>
                            {method.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.cardNumber}>
                            •••• {method.last4}
                          </Text>
                          <Text style={styles.cardExpiry}>
                            Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                          </Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.cardActions}>
                          {!method.isDefault && (
                            <TouchableOpacity
                              style={styles.cardActionBtn}
                              onPress={() => handleSetDefault(method)}
                            >
                              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => handleRemoveMethod(method)}
                          >
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>

                {/* Add Card Button */}
                <TouchableOpacity
                  style={styles.addCardButton}
                  onPress={() => {
                    Alert.alert(
                      'Add New Card',
                      'To add a new card, go to the Subscriptions screen and choose Paystack at checkout. Your card will be saved automatically after the first payment.',
                    );
                  }}
                >
                  <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.addCardText}>Add New Card</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Methods</Text>
              <GlassCard noPadding>
                <View style={styles.methodSummaryItem}>
                  <View style={[styles.methodSummaryIcon, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                    <Ionicons name="phone-portrait-outline" size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.methodSummaryInfo}>
                    <Text style={styles.methodSummaryLabel}>M-Pesa</Text>
                    <Text style={styles.methodSummaryDesc}>Pay via STK Push on your phone</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                </View>

                <View style={[styles.methodSummaryItem, styles.cardItemBorder]}>
                  <View style={[styles.methodSummaryIcon, { backgroundColor: 'rgba(0,212,170,0.15)' }]}>
                    <Ionicons name="card-outline" size={22} color={COLORS.accent} />
                  </View>
                  <View style={styles.methodSummaryInfo}>
                    <Text style={styles.methodSummaryLabel}>Paystack (Card)</Text>
                    <Text style={styles.methodSummaryDesc}>Pay with debit/credit card</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                </View>
              </GlassCard>
            </View>
          </>
        )}

        {/* ===== BILLING HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <>
            {sortedBilling.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={56} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No Billing History</Text>
                <Text style={styles.emptyDesc}>
                  Your payment receipts will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment History</Text>
                <GlassCard noPadding>
                  {sortedBilling.map((entry, index) => {
                    const statusColor = getStatusColor(entry.status);
                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.billingItem,
                          index < sortedBilling.length - 1 && styles.cardItemBorder,
                        ]}
                      >
                        {/* Status Dot */}
                        <View style={[styles.billingDot, { backgroundColor: statusColor + '30' }]}>
                          <View style={[styles.billingDotInner, { backgroundColor: statusColor }]} />
                        </View>

                        {/* Billing Info */}
                        <View style={styles.billingInfo}>
                          <Text style={styles.billingDesc}>{entry.description}</Text>
                          <Text style={styles.billingDate}>
                            {formatDate(entry.date)} • {getMethodLabel(entry.paymentMethod)}
                          </Text>
                          {entry.mpesaReceipt && (
                            <Text style={styles.billingReceipt}>
                              M-Pesa: {entry.mpesaReceipt}
                            </Text>
                          )}
                          {entry.paystackReference && (
                            <Text style={styles.billingReceipt}>
                              Ref: {entry.paystackReference}
                            </Text>
                          )}
                        </View>

                        {/* Amount & Status */}
                        <View style={styles.billingRight}>
                          <Text style={styles.billingAmount}>
                            {formatPrice(entry.amount, entry.currency)}
                          </Text>
                          <View style={[styles.billingStatusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.billingStatusText, { color: statusColor }]}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>
              </View>
            )}
          </>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabActive: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderColor: COLORS.primary + '40',
  },
  tabLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary + '30',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  tabBadgeTextActive: {
    color: COLORS.primary,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  // Freemium payment banner
  freemiumPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 184, 77, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.2)',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  freemiumPaymentText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    color: COLORS.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
  // Card Items
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  cardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  cardBrandIcon: {
    width: 44,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrand: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  cardNumber: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  cardExpiry: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  cardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
  },
  addCardText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Method Summary
  methodSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  methodSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodSummaryInfo: {
    flex: 1,
  },
  methodSummaryLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  methodSummaryDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // Billing Items
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  billingDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billingDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  billingInfo: {
    flex: 1,
  },
  billingDesc: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  billingDate: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  billingReceipt: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  billingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  billingAmount: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  billingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  billingStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
