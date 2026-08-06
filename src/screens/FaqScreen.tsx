/**
 * HAMA™ FAQ Screen
 *
 * Frequently asked questions organized by category, with expandable
 * accordion cards and a contact/support CTA.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'accounts',
    title: 'Accounts & Profiles',
    icon: 'person-circle-outline',
    color: COLORS.primary,
    items: [
      {
        question: 'How do I create a HAMA account?',
        answer: 'Tap Sign Up on the login screen and complete your profile setup. Your account unlocks all workspaces — House Seeker, Landlord, Seller, and Service Provider.',
      },
      {
        question: 'What is a workspace and how do I activate one?',
        answer: 'Workspaces are your role-specific dashboards. Open "My Plan" and activate any workspace — landlord, seller, or service provider — to access its tools. The House Seeker workspace is active by default.',
      },
      {
        question: 'Can I use multiple workspaces at the same time?',
        answer: 'Yes. You can be a landlord and a seller at once — activate each workspace in My Plan and switch between their dashboards any time.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings → Delete Account. This permanently removes your profile and data. Some records required by law may be retained.',
      },
    ],
  },
  {
    id: 'housing',
    title: 'Finding Housing',
    icon: 'home-outline',
    color: COLORS.accent,
    items: [
      {
        question: 'How do I search for properties?',
        answer: 'Use the search bar on Home or the dedicated Search tab. Filter by location, price, property type, and more. Save your searches and properties to Favorites.',
      },
      {
        question: 'How do I contact a landlord?',
        answer: 'Open the property listing and tap Message or call the listed number. You can chat with landlords directly from your Inbox.',
      },
      {
        question: 'What is the free trial?',
        answer: 'New house seekers get a 7-day free trial of Premium — unlimited saves, AI recommendations, advanced filters, and more — no card required. Start it on the Subscriptions screen.',
      },
      {
        question: 'What happens when my free trial ends?',
        answer: 'You can continue on the Free plan (basic search, up to 20 saved properties) or choose a Premium or Pro plan to keep full access.',
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace & Selling',
    icon: 'cart-outline',
    color: COLORS.warning,
    items: [
      {
        question: 'How do I sell products on HAMA?',
        answer: 'Activate the Seller workspace in My Plan, then create your storefront and add products. Basic (KSh 399/mo) includes 25 products; higher plans add featured store and analytics.',
      },
      {
        question: 'What commission does HAMA charge?',
        answer: 'HAMA charges a 5% commission per completed sale on the marketplace, and 10–15% per service booking, depending on the category.',
      },
      {
        question: 'How do buyers pay for my products?',
        answer: 'Buyers check out via M-Pesa, Paystack, or Stripe depending on availability. Payments are processed securely through the payment providers.',
      },
    ],
  },
  {
    id: 'services',
    title: 'Service Providers',
    icon: 'construct-outline',
    color: COLORS.info,
    items: [
      {
        question: 'How do I list my services?',
        answer: 'Activate the Service Provider workspace and complete the onboarding wizard — your profile, services, portfolio, and pricing. You can save a draft and resume later.',
      },
      {
        question: 'How does ranking work?',
        answer: 'Providers are ranked by relevance and plan boost. Basic plans get a standard boost, Premium plans get top-of-search priority, and verified providers rank higher.',
      },
      {
        question: 'How do I receive quotes and jobs?',
        answer: 'Customers message you directly from your public profile. Your dashboard tracks quotations, active jobs (Kanban), and your wallet.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Subscriptions',
    icon: 'card-outline',
    color: COLORS.secondary,
    items: [
      {
        question: 'How do I subscribe to a plan?',
        answer: 'Open Subscriptions, pick your role tab, and choose a plan. Payments are made via M-Pesa STK push — enter your phone number and approve the prompt on your phone.',
      },
      {
        question: 'Is there a free plan?',
        answer: 'Yes. Every role has a Free plan. Seeker Free includes basic search and up to 20 saved properties; seller/provider Free lets you browse but requires a paid plan to sell or list services.',
      },
      {
        question: 'When does my subscription renew?',
        answer: 'Subscriptions run for 30 days from payment and can be renewed before expiry. Your active plan and renewal date are shown on the Subscriptions screen.',
      },
      {
        question: 'What is the M-Pesa reference number I receive?',
        answer: 'The AccountReference (HAMA-<Tier>-<Role>) links your payment to your subscription. Keep your M-Pesa receipt number as proof of payment.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Trust',
    icon: 'shield-checkmark-outline',
    color: COLORS.success,
    items: [
      {
        question: 'How does HAMA keep my data safe?',
        answer: 'We encrypt data in transit and at rest, use secure payment providers, and never store full card details. See our Privacy Policy for details.',
      },
      {
        question: 'How do I report a suspicious listing or user?',
        answer: 'Report through the listing or profile (Report option), or contact support@hama.app. Our team reviews reports and can remove offending accounts.',
      },
      {
        question: 'Are payments refundable?',
        answer: 'Refunds are handled case-by-case per our terms. Contact support with your M-Pesa receipt number if you were charged incorrectly.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support & Troubleshooting',
    icon: 'headset-outline',
    color: COLORS.error,
    items: [
      {
        question: 'I did not receive the M-Pesa prompt. What now?',
        answer: 'Make sure you entered the correct Safaricom number and that your phone has network. You can retry the payment — a duplicate charge is auto-refunded by Safaricom if the prompt is not approved.',
      },
      {
        question: 'I paid but my subscription is not active.',
        answer: 'Check the Subscriptions screen after 2 minutes. If still inactive, contact support with your M-Pesa receipt number and we will activate it manually.',
      },
      {
        question: 'How do I contact HAMA support?',
        answer: 'Email support@hama.app or legal@hama.app, or use Help & Support in Settings.',
      },
    ],
  },
];

interface FaqScreenProps {
  navigation?: any;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setOpenCategory((prev) => (prev === id ? null : id));
    setOpenItem(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>FAQ</Text>
        </View>
        <Text style={styles.headerSubtitle}>Answers to common questions</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {FAQ_CATEGORIES.map((category) => {
          const isOpen = openCategory === category.id;
          return (
            <GlassCard key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                activeOpacity={0.7}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>
                <View style={styles.categoryHeaderText}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>
                    {category.items.length} question{category.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>

              {isOpen &&
                category.items.map((item, index) => {
                  const itemKey = `${category.id}-${index}`;
                  const isItemOpen = openItem === itemKey;
                  return (
                    <TouchableOpacity
                      key={itemKey}
                      style={[styles.faqItem, index === category.items.length - 1 && styles.faqItemLast]}
                      activeOpacity={0.7}
                      onPress={() => setOpenItem(isItemOpen ? null : itemKey)}
                    >
                      <View style={styles.faqQuestionRow}>
                        <Text style={styles.faqQuestion}>{item.question}</Text>
                        <Ionicons
                          name={isItemOpen ? 'remove-circle-outline' : 'add-circle-outline'}
                          size={18}
                          color={isItemOpen ? COLORS.primary : COLORS.textTertiary}
                        />
                      </View>
                      {isItemOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
                    </TouchableOpacity>
                  );
                })}
            </GlassCard>
          );
        })}

        {/* Contact CTA */}
        <GlassCard style={styles.contactCard}>
          <LinearGradient
            colors={['rgba(255, 107, 0, 0.12)', 'rgba(255, 255, 255, 0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactGradient}
          >
            <Ionicons name="chatbubbles-outline" size={28} color={COLORS.primary} />
            <Text style={styles.contactTitle}>Still have questions?</Text>
            <Text style={styles.contactText}>
              Our support team is happy to help. Reach us at support@hama.app or via Help & Support in Settings.
            </Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Linking.openURL('mailto:support@hama.app')}
              >
                <Ionicons name="mail-outline" size={16} color="#fff" />
                <Text style={styles.contactButtonText}>Email Support</Text>
              </TouchableOpacity>
              {navigation?.navigate && (
                <TouchableOpacity
                  style={[styles.contactButton, styles.contactButtonSecondary]}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Ionicons name="settings-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.contactButtonText, { color: COLORS.primary }]}>Help & Support</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  categoryCard: {
    padding: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  categoryCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  faqItem: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  faqItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqAnswer: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  contactCard: {
    overflow: 'hidden',
  },
  contactGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  contactTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  contactText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  contactButtonSecondary: {
    backgroundColor: 'rgba(255,107,0,0.12)',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
