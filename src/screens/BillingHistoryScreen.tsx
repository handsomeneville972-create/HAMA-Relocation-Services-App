import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { MOCK_BILLING_HISTORY } from '../constants/data';
import { formatPrice } from '../utils/currency';
import { isSubscriptionPaymentEnabled } from '../config/earlyAccess';
import type { CurrencyCode } from '../constants/types';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { BillingEntry } from '../constants/types';

// ============================================================
// Types
// ============================================================

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'refunded';
type MethodFilter = 'all' | 'mpesa' | 'card' | 'paystack';

interface BillingSummary {
  totalSpent: number;
  totalTransactions: number;
  successRate: number;
  mostUsedMethod: string;
}

// ============================================================
// Helpers
// ============================================================

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'refunded', label: 'Refunded' },
];

const METHOD_FILTERS: { key: MethodFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Card', icon: 'card-outline' },
  { key: 'paystack', label: 'Paystack', icon: 'card-outline' },
];

function getStatusColor(status: BillingEntry['status']): string {
  switch (status) {
    case 'paid': return COLORS.success;
    case 'pending': return COLORS.warning;
    case 'failed': return COLORS.error;
    case 'refunded': return COLORS.info;
  }
}

function getStatusIcon(status: BillingEntry['status']): string {
  switch (status) {
    case 'paid': return 'checkmark-circle';
    case 'pending': return 'time-outline';
    case 'failed': return 'close-circle';
    case 'refunded': return 'refresh-circle';
  }
}

function getMethodIcon(method: BillingEntry['paymentMethod']): string {
  switch (method) {
    case 'mpesa': return 'phone-portrait-outline';
    case 'card': return 'card-outline';
    case 'paystack': return 'card-outline';
  }
}

function getMethodLabel(method: BillingEntry['paymentMethod']): string {
  switch (method) {
    case 'mpesa': return 'M-Pesa';
    case 'card': return 'Card';
    case 'paystack': return 'Paystack';
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

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonthYear(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number, currency: CurrencyCode): string {
  return formatPrice(amount, currency);
}

function getSummary(data: BillingEntry[]): BillingSummary {
  const paidEntries = data.filter(e => e.status === 'paid');
  const totalSpent = paidEntries.reduce((sum, e) => sum + e.amount, 0);
  const methodCounts: Record<string, number> = {};
  data.forEach(e => {
    methodCounts[e.paymentMethod] = (methodCounts[e.paymentMethod] || 0) + 1;
  });
  const mostUsed = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSpent,
    totalTransactions: data.length,
    successRate: data.length > 0 ? Math.round((paidEntries.length / data.length) * 100) : 0,
    mostUsedMethod: mostUsed ? getMethodLabel(mostUsed[0] as any) : 'N/A',
  };
}

// ============================================================
// Receipt Detail Modal
// ============================================================

const ReceiptModal: React.FC<{
  entry: BillingEntry | null;
  visible: boolean;
  onClose: () => void;
}> = ({ entry, visible, onClose }) => {
  const insets = useSafeAreaInsets();

  if (!entry) return null;

  const statusColor = getStatusColor(entry.status);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + SPACING.md }]}>
          {/* Handle */}
          <View style={styles.modalHandle} />
          <View style={styles.modalHandleBar} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Receipt Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            {/* Receipt Icon */}
            <LinearGradient
              colors={[statusColor + '30', statusColor + '10']}
              style={[styles.receiptIconContainer, { borderColor: statusColor + '40' }]}
            >
              <Ionicons name="receipt-outline" size={40} color={statusColor} />
            </LinearGradient>

            {/* Amount */}
            <Text style={styles.receiptAmount}>
              {formatCurrency(entry.amount, entry.currency)}
            </Text>

            {/* Status Badge */}
            <View style={[styles.receiptStatusBadge, { backgroundColor: statusColor + '20' }]}>
              <Ionicons name={getStatusIcon(entry.status) as any} size={14} color={statusColor} />
              <Text style={[styles.receiptStatusText, { color: statusColor }]}>
                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
              </Text>
            </View>

            {/* Details Card */}
            <GlassCard style={styles.receiptDetailsCard}>
              {/* Plan & Description */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Plan</Text>
                <Text style={styles.receiptValue}>{entry.planName}</Text>
              </View>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Description</Text>
                <Text style={[styles.receiptValue, styles.receiptValueMuted]}>{entry.description}</Text>
              </View>
              <View style={styles.receiptDivider} />

              {/* Payment Info */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Method</Text>
                <View style={styles.receiptMethodChip}>
                  <Ionicons name={getMethodIcon(entry.paymentMethod) as any} size={14} color={COLORS.primary} />
                  <Text style={styles.receiptMethodText}>
                    {getMethodLabel(entry.paymentMethod)}
                  </Text>
                </View>
              </View>

              {entry.mpesaReceipt && (
                <>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>M-Pesa Receipt</Text>
                    <Text style={[styles.receiptValue, styles.receiptValueMono]}>
                      {entry.mpesaReceipt}
                    </Text>
                  </View>
                </>
              )}

              {entry.paystackReference && (
                <>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Reference</Text>
                    <Text style={[styles.receiptValue, styles.receiptValueMono]}>
                      {entry.paystackReference}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.receiptDivider} />

              {/* Date & Time */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptValue}>{formatDate(entry.date)}</Text>
              </View>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Time</Text>
                <Text style={styles.receiptValue}>{formatTime(entry.date)}</Text>
              </View>
              <View style={styles.receiptDivider} />

              {/* Transaction ID */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction ID</Text>
                <Text style={[styles.receiptValue, styles.receiptValueMono]}>{entry.id}</Text>
              </View>

              {/* Receipt ID */}
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Receipt #</Text>
                <Text style={[styles.receiptValue, styles.receiptValueMono]}>
                  RCP-{entry.id.toUpperCase()}
                </Text>
              </View>
            </GlassCard>

            {/* Action Buttons */}
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.receiptActionBtn}>
                <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                <Text style={styles.receiptActionText}>Share Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.receiptActionBtn, styles.receiptActionBtnSecondary]}>
                <Ionicons name="download-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.receiptActionText, { color: COLORS.textSecondary }]}>Download</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.receiptFooterText}>HAMA™ • Payment Receipt</Text>
              <Text style={styles.receiptFooterTextSmall}>Thank you for your business!</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
// Main Screen
// ============================================================

export const BillingHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<BillingEntry | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Simulate loading on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // Filtered data
  const filteredBilling = useMemo(() => {
    let data = [...MOCK_BILLING_HISTORY];

    if (statusFilter !== 'all') {
      data = data.filter(e => e.status === statusFilter);
    }
    if (methodFilter !== 'all') {
      data = data.filter(e => e.paymentMethod === methodFilter);
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [statusFilter, methodFilter]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, BillingEntry[]> = {};
    filteredBilling.forEach(entry => {
      const key = formatMonthYear(entry.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredBilling]);

  const monthKeys = useMemo(
    () => Object.keys(groupedByMonth),
    [groupedByMonth]
  );

  // Summary
  const summary = useMemo(
    () => getSummary(filteredBilling),
    [filteredBilling]
  );

  // Open receipt
  const handleViewReceipt = (entry: BillingEntry) => {
    setSelectedReceipt(entry);
    setShowReceipt(true);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#0A0A0A']}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Billing History</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
        <View style={{ padding: SPACING.md, gap: SPACING.md }}>
          <SkeletonLoader type="card" count={1} />
          <SkeletonLoader type="notification" count={5} />
        </View>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Billing History</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Freemium banner */}
      {!isSubscriptionPaymentEnabled() && (
        <View style={styles.freemiumBanner}>
          <Ionicons name="information-circle" size={18} color={COLORS.warning} />
          <Text style={styles.freemiumBannerText}>
            Subscriptions will be activated soon. Until then, all users receive complimentary access to premium features.
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ===== SUMMARY CARDS ===== */}
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.accent + '20' }]}>
              <Ionicons name="cash-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalSpent, 'KSh')}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </GlassCard>

          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </GlassCard>

          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.info + '20' }]}>
              <Ionicons name="trending-up-outline" size={20} color={COLORS.info} />
            </View>
            <Text style={styles.summaryValue}>{summary.successRate}%</Text>
            <Text style={styles.summaryLabel}>Success Rate</Text>
          </GlassCard>
        </View>

        {/* ===== FILTER CHIPS ===== */}
        {/* Status Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {STATUS_FILTERS.map(f => {
              const isActive = statusFilter === f.key;
              const chipColor = f.key !== 'all' ? getStatusColor(f.key) : COLORS.primary;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    isActive && { backgroundColor: chipColor + '20', borderColor: chipColor + '40' },
                  ]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, isActive && { color: chipColor }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Method Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {METHOD_FILTERS.map(f => {
              const isActive = methodFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    isActive && { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent + '40' },
                  ]}
                  onPress={() => setMethodFilter(f.key)}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={isActive ? COLORS.accent : COLORS.textTertiary}
                  />
                  <Text style={[styles.filterChipText, isActive && { color: COLORS.accent }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== BILLING LIST ===== */}
        {filteredBilling.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyDesc}>
              {statusFilter !== 'all' || methodFilter !== 'all'
                ? 'No billing entries match your filters. Try adjusting them.'
                : 'Your payment receipts will appear here.'}
            </Text>
            {(statusFilter !== 'all' || methodFilter !== 'all') && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => { setStatusFilter('all'); setMethodFilter('all'); }}
              >
                <Ionicons name="close-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.clearFilterText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {monthKeys.map(monthKey => (
              <View key={monthKey} style={styles.monthGroup}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{monthKey}</Text>
                  <View style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>{groupedByMonth[monthKey].length}</Text>
                  </View>
                </View>

                <GlassCard noPadding>
                  {groupedByMonth[monthKey].map((entry, index) => {
                    const statusColor = getStatusColor(entry.status);
                    const entries = groupedByMonth[monthKey];
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={[
                          styles.billingItem,
                          index < entries.length - 1 && styles.billingItemBorder,
                        ]}
                        onPress={() => handleViewReceipt(entry)}
                        activeOpacity={0.7}
                      >
                        {/* Status Icon */}
                        <View style={[styles.billingIcon, { backgroundColor: statusColor + '20' }]}>
                          <Ionicons name={getStatusIcon(entry.status) as any} size={18} color={statusColor} />
                        </View>

                        {/* Billing Info */}
                        <View style={styles.billingInfo}>
                          <Text style={styles.billingDesc} numberOfLines={1}>
                            {entry.description}
                          </Text>
                          <View style={styles.billingMetaRow}>
                            <View style={styles.billingMethodChip}>
                              <Ionicons
                                name={getMethodIcon(entry.paymentMethod) as any}
                                size={10}
                                color={COLORS.textTertiary}
                              />
                              <Text style={styles.billingMethodText}>
                                {getMethodLabel(entry.paymentMethod)}
                              </Text>
                            </View>
                            <Text style={styles.billingDate}>
                              {formatDate(entry.date)}
                            </Text>
                          </View>
                        </View>

                        {/* Amount & Chevron */}
                        <View style={styles.billingRight}>
                          <Text style={styles.billingAmount}>
                            {formatCurrency(entry.amount, entry.currency)}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </GlassCard>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Receipt Modal */}
      <ReceiptModal
        entry={selectedReceipt}
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </View>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Header
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

  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },

  // Freemium banner
  freemiumBanner: {
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
    marginTop: SPACING.sm,
  },
  freemiumBannerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Filters
  filterSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: SPACING.xs,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
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
  filterChipText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Section
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Month Group
  monthGroup: {
    marginBottom: SPACING.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  monthTitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  monthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
  },
  monthBadgeText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Billing Items
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  billingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  billingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billingInfo: {
    flex: 1,
  },
  billingDesc: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  billingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  billingMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  billingMethodText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  billingDate: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  billingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billingAmount: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
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
    maxWidth: 260,
    lineHeight: 20,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
  },
  clearFilterText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== RECEIPT MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
    opacity: 0.3,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  modalContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },

  // Receipt Header
  receiptIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    marginBottom: SPACING.xs,
  },
  receiptAmount: {
    ...FONTS.h1,
    color: COLORS.text,
    textAlign: 'center',
  },
  receiptStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  receiptStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Details Card
  receiptDetailsCard: {
    padding: SPACING.md,
    gap: 0,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  receiptLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  receiptValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '55%',
  },
  receiptValueMuted: {
    color: COLORS.textSecondary,
    fontWeight: '400',
    fontSize: 12,
  },
  receiptValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
  },
  receiptMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  receiptMethodText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions
  receiptActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  receiptActionBtnSecondary: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.glassBorder,
  },
  receiptActionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  receiptFooter: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 2,
  },
  receiptFooterText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  receiptFooterTextSmall: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
});
