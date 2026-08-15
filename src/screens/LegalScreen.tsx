/**
 * HAMA™ Legal Pages
 *
 * Displays Terms of Service, Privacy Policy, Cookie Policy, and
 * Acceptable Use Policy in a scrollable screen.
 *
 * In production, these would be loaded from a CMS or markdown files.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

type LegalPage = 'terms' | 'privacy' | 'cookies' | 'acceptable-use';

const HOSTED_BASE = 'https://hama-website-eta.vercel.app';

interface LegalScreenProps {
  navigation?: any;
  initialPage?: LegalPage;
}

const LEGAL_TABS: { key: LegalPage; label: string }[] = [
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'cookies', label: 'Cookie Policy' },
  { key: 'acceptable-use', label: 'Acceptable Use' },
];

const LEGAL_CONTENT: Record<LegalPage, { title: string; hostedUrl?: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: 'Terms of Service',
    hostedUrl: `${HOSTED_BASE}/terms.html`,
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using HAMA ("the Platform"), you agree to be bound by these Terms of Service. You must be at least 18 years old to use the Platform. If you do not agree, please do not use the Platform.',
      },
      {
        heading: '2. Description of Service',
        body: 'HAMA is a housing and marketplace platform connecting property seekers with landlords, sellers, service providers, and communities. The Platform enables property listings, product buying/selling, service provider discovery, community features, and payment management.',
      },
      {
        heading: '3. User Accounts',
        body: 'You must create an account to use certain features. You are responsible for maintaining account security and for all activities under your account. You must provide accurate information and notify us of any unauthorized use.',
      },
      {
        heading: '4. User Conduct',
        body: 'You agree not to use the Platform for unlawful purposes, post false or misleading information, impersonate others, harass users, manipulate listings or reviews, attempt to breach security, use automated scraping tools, or violate applicable laws.',
      },
      {
        heading: '5. Listings and Transactions',
        body: 'Users who post listings are solely responsible for the accuracy and legality of their content. HAMA does not guarantee listing quality, safety, legality, or the ability of users to complete transactions. All transactions are at users\' own risk.',
      },
      {
        heading: '6. Payments',
        body: 'Premium features and transactions may require payment processed through Stripe, Paystack, or M-Pesa. HAMA does not store full payment card details. All payments are subject to the applicable payment processor\'s terms.',
      },
      {
        heading: '7. Subscriptions',
        body: 'Certain premium features require an active subscription plan, payable monthly via M-Pesa, Paystack, or Stripe. Subscriptions renew on a monthly cycle and can be cancelled at any time through the app. Features are provided for the duration of your active plan and revert to the Free tier upon expiry or cancellation.',
      },
      {
        heading: '8. Intellectual Property',
        body: 'The Platform is owned by HAMA and protected by intellectual property laws. You retain ownership of content you post but grant HAMA a worldwide, non-exclusive, royalty-free license to display and promote your content on the Platform.',
      },
      {
        heading: '9. Limitation of Liability',
        body: 'HAMA shall not be liable for any indirect, incidental, special, consequential, or punitive damages. The Platform is provided "as is" without warranties of any kind, either express or implied.',
      },
      {
        heading: '10. Termination',
        body: 'We may suspend or terminate your account for violations of these Terms or at our discretion. Upon termination, your right to use the Platform ceases immediately.',
      },
      {
        heading: '11. Changes to Terms',
        body: 'We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform. Your continued use after changes take effect constitutes acceptance.',
      },
      {
        heading: '12. Contact',
        body: 'For questions about these Terms, contact us at legal@hama.app or support@hama.app.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    hostedUrl: `${HOSTED_BASE}/privacy.html`,
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect information you provide directly: name, email address, phone number, profile information, verification documents, listings, messages, reviews, and payment details processed through our partners (Stripe, Paystack, M-Pesa). We also automatically collect usage data, device information, log data, and approximate location based on IP address.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your information to provide and maintain the Platform, authenticate your identity, personalize your experience, process payments, send account-related communications, detect fraud and maintain safety, analyze usage to improve our features, and comply with legal obligations.',
      },
      {
        heading: '3. How We Share Your Information',
        body: 'We do not sell your personal information. We may share data with: other users (your name, avatar, and listings are visible as part of normal Platform functionality), trusted service providers who assist in operating the Platform (Supabase, Stripe, Paystack, Vercel), and when required by law or to protect rights and safety.',
      },
      {
        heading: '4. Data Security',
        body: 'We implement industry-standard security measures including TLS/SSL encryption in transit, encryption at rest for sensitive data, Row Level Security (RLS) on our database, restricted access to production systems, and regular security assessments. No method of electronic storage is 100% secure.',
      },
      {
        heading: '5. Your Rights',
        body: 'You have the right to access, correct, or delete your personal data. You can request a copy of your data, withdraw consent, object to processing, or request restriction. Exercise these rights through your account settings or by contacting privacy@hama.app.',
      },
      {
        heading: '6. Data Retention',
        body: 'Account data is retained while active and for 30 days after deletion. Listings are kept until removed. Messages are retained during your use of chat. Payment records are kept for 7 years per financial regulations. Analytics data is anonymized after 24 months.',
      },
      {
        heading: '7. Third-Party Services',
        body: 'The Platform integrates with third-party services including Supabase (database), Stripe and Paystack (payments), Safaricom (M-Pesa), and Vercel (hosting). Each has its own privacy policy governing their handling of your data.',
      },
      {
        heading: '8. Children\'s Privacy',
        body: 'The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly.',
      },
      {
        heading: '9. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform or by email. The last updated date at the top indicates when this policy was last revised.',
      },
      {
        heading: '10. Contact Us',
        body: 'For questions about this Privacy Policy, contact us at privacy@hama.app or support@hama.app.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit a website or application. They help us remember your preferences, understand how you use the Platform, and improve your experience.',
      },
      {
        heading: '2. Types of Cookies We Use',
        body: 'Essential cookies: required for the Platform to function (e.g., authentication, session management). Analytics cookies: help us understand how users interact with the Platform. Preference cookies: remember your settings and preferences.',
      },
      {
        heading: '3. Managing Cookies',
        body: 'You can control cookies through your browser or device settings. However, disabling certain cookies may affect Platform functionality. Most browsers provide options to block or delete cookies.',
      },
      {
        heading: '4. Third-Party Cookies',
        body: 'We may use third-party analytics services (e.g., Amplitude, PostHog) that set their own cookies. These services help us understand usage patterns and improve the Platform. We do not control these third-party cookies.',
      },
      {
        heading: '5. Updates to This Policy',
        body: 'We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the Platform constitutes acceptance of any changes.',
      },
    ],
  },
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This Acceptable Use Policy outlines the rules and guidelines for using HAMA™. Our goal is to maintain a safe, respectful, and productive community for all users.',
      },
      {
        heading: '2. Prohibited Activities',
        body: 'You may not use the Platform to: engage in illegal activities, post harmful or offensive content, harass or intimidate others, impersonate individuals or entities, spam or solicit inappropriately, manipulate listings or reviews, attempt to breach security measures, or violate others\' intellectual property rights.',
      },
      {
        heading: '3. Content Standards',
        body: 'All content you post must be accurate, truthful, and respectful. You retain ownership of your content but grant HAMA™ a license to display it on the Platform. We reserve the right to remove content that violates this policy.',
      },
      {
        heading: '4. Enforcement',
        body: 'Violations of this policy may result in: content removal, account suspension, permanent account termination, or legal action where appropriate. We reserve the right to take any action we deem necessary to protect our community.',
      },
      {
        heading: '5. Reporting Violations',
        body: 'If you encounter content or behavior that violates this policy, please report it through the Platform\'s reporting tools or contact support@hama.app. We review all reports and take appropriate action.',
      },
    ],
  },
};

export const LegalScreen: React.FC<LegalScreenProps> = ({ navigation, initialPage = 'terms' }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LegalPage>(initialPage);
  const content = LEGAL_CONTENT[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <Text style={styles.headerSubtitle}>Policies and terms governing your use of HAMA™</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {LEGAL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>{content.title}</Text>
        {'hostedUrl' in content && content.hostedUrl && (
          <TouchableOpacity style={styles.onlineLink} onPress={() => Linking.openURL(content.hostedUrl!)}>
            <Ionicons name="open-outline" size={16} color={COLORS.primary} />
            <Text style={styles.onlineLinkText}>View Full Policy Online</Text>
          </TouchableOpacity>
        )}
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
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
    paddingBottom: SPACING.md,
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
  tabBar: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  tabContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
scrollContent: {
      padding: SPACING.md,
      gap: SPACING.lg,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  onlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  onlineLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
