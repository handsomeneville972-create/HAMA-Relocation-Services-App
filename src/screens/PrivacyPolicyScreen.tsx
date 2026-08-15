import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { FadeInView } from '../components/BlurText';

interface PrivacyPolicyScreenProps {
  navigation?: { goBack: () => void };
}

const SECTIONS = [
  {
    icon: 'information-circle-outline' as const,
    title: '1. Information We Collect',
    body: `We collect information you provide directly and automatically when you use HAMA™:

Account Information: Name, email address, phone number, profile photo, and verification documents when you create an account.

Listing Data: Property listings, service profiles, pricing, images, descriptions, locations, and availability you publish.

Transactions: Payment details processed through our partners (Stripe, Paystack, M-Pesa). We do NOT store full payment card numbers.

Communications: Messages sent through the platform, customer support inquiries, and reviews you submit.

Usage Data: Pages viewed, features used, search queries, session duration, device type, operating system, IP address, and approximate location.

Cookies & Tracking: We use cookies and similar technologies to remember your preferences, analyse platform usage, and improve your experience.`,
  },
  {
    icon: 'settings-outline' as const,
    title: '2. How We Use Your Information',
    body: `We use your information to:

Provide, maintain, and improve the HAMA™ platform and its features.

Authenticate your identity and secure your account.

Personalise your experience, including property recommendations and search results.

Process payments and manage subscriptions through our secure payment partners.

Send account-related communications, including security alerts, updates, and support messages.

Detect and prevent fraud, abuse, and security incidents.

Analyse usage patterns to improve our features and develop new ones.

Comply with legal obligations and enforce our Terms of Service.

Facilitate communication between buyers, sellers, tenants, and service providers.`,
  },
  {
    icon: 'people-outline' as const,
    title: '3. How We Share Your Information',
    body: `We do NOT sell your personal information. We may share data in the following circumstances:

With Other Users: Your name, profile photo, listings, and reviews are visible as part of normal platform functionality. This is how HAMA™ works — users need to see each other's profiles and listings to transact.

With Service Providers: We share data with trusted third parties who help us operate the platform, including Supabase (database hosting), Stripe and Paystack (payment processing), Safaricom (M-Pesa integration), and Vercel (hosting). These providers are contractually bound to protect your data.

For Legal Reasons: We may disclose information when required by law, court order, or governmental authority, or when necessary to protect the rights, safety, or property of HAMA™, our users, or the public.

Business Transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction, subject to the same privacy protections.

With Your Consent: We may share information for purposes not described here only with your explicit consent.`,
  },
  {
    icon: 'lock-closed-outline' as const,
    title: '4. Data Security',
    body: `We implement industry-standard security measures to protect your data:

TLS/SSL encryption for all data in transit.

AES-256 encryption at rest for sensitive data.

Row Level Security (RLS) on our Supabase database to ensure users can only access their own data.

Role-based access controls for all internal systems.

Regular security assessments and penetration testing.

Secure authentication with encrypted passwords and optional two-factor authentication.

Automatic session timeout and suspicious activity detection.

While no method of electronic storage is 100% secure, we take every reasonable precaution to safeguard your information and will promptly notify affected users in the event of a data breach.`,
  },
  {
    icon: 'finger-print-outline' as const,
    title: '5. Your Rights',
    body: `You have the following rights regarding your personal data:

Access: Request a copy of all personal data we hold about you.

Correction: Request correction of inaccurate or incomplete data.

Deletion: Request deletion of your personal data, subject to legal retention requirements.

Portability: Request your data in a structured, commonly used, machine-readable format.

Withdraw Consent: Where processing is based on consent, you may withdraw it at any time.

Object to Processing: Object to processing of your data for certain purposes, including direct marketing.

Restrict Processing: Request restriction of processing in certain circumstances.

To exercise any of these rights, visit your Account Settings or contact us at privacy@hama.app. We will respond to all requests within 30 days.`,
  },
  {
    icon: 'time-outline' as const,
    title: '6. Data Retention',
    body: `We retain your information for as long as necessary to provide the platform and fulfil the purposes described in this policy:

Active Account Data: Retained while your account is active and used regularly.

Account Deletion: Personal data is deleted within 30 days of account closure, except where retention is required by law.

Listings: Removed when you delete them or within 90 days of account closure.

Messages: Chat messages are retained during your active use of the platform.

Payment Records: Retained for 7 years as required by financial regulations and tax law.

Analytics Data: Anonymised after 24 months so it can no longer identify you.

Backup Data: Securely deleted within 90 days of account closure.`,
  },
  {
    icon: 'globe-outline' as const,
    title: '7. International Data Transfers',
    body: `HAMA™ operates from Kenya and serves users across Africa and beyond. Your data may be processed in countries other than your own.

Data Transfers: When you use HAMA™, your data may be transferred to and processed in Kenya, the United States (where our hosting providers operate), or other countries where our service providers maintain facilities.

Safeguards: We ensure that any international data transfers are protected by appropriate safeguards, including standard contractual clauses and data processing agreements with our service providers.

By using HAMA™, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules.`,
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: '8. Cookies & Tracking Technologies',
    body: `We use cookies and similar technologies to improve your experience:

Essential Cookies: Required for the platform to function, including authentication, session management, and security features.

Analytics Cookies: Help us understand how users interact with the platform so we can improve features and fix issues. We use privacy-focused analytics tools.

Preference Cookies: Remember your settings, language preferences, and other choices to personalise your experience.

Managing Cookies: You can control cookies through your browser or device settings. Disabling certain cookies may affect platform functionality.

Third-Party Analytics: We may use services like Amplitude or PostHog that set their own cookies to collect usage data. These are subject to their own privacy policies.`,
  },
  {
    icon: 'person-outline' as const,
    title: '9. Children\'s Privacy',
    body: `HAMA™ is not intended for users under 18 years of age.

We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a child under 18, we will take steps to delete that information promptly.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@hama.app and we will remove it.

Users aged 13–17 may only use HAMA™ with the consent and supervision of a parent or legal guardian.`,
  },
  {
    icon: 'notifications-outline' as const,
    title: '10. Communication Preferences',
    body: `You control the communications you receive from HAMA™:

Account Communications: Transactional emails and push notifications related to your account, bookings, and security. These cannot be opted out of while your account is active.

Marketing Communications: Promotional emails, newsletters, and push notifications about new features, deals, and listings. You can opt out at any time through your notification settings.

SMS Notifications: Text messages for bookings, verifications, and alerts. You can disable SMS notifications in your account settings.

To manage your preferences, visit Settings > Notifications in the app or click the unsubscribe link in any marketing email.`,
  },
  {
    icon: 'document-text-outline' as const,
    title: '11. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.

Material Changes: When we make significant changes, we will notify you through the platform, by email, or through a prominent notice before the changes take effect.

In-App Notifications: You may be prompted to review and accept updated policies when you next open the app.

Previous Versions: Earlier versions of this policy are available upon request by contacting privacy@hama.app.

The "Last Updated" date at the top of this page indicates when this policy was last revised. Your continued use of HAMA™ after changes take effect constitutes acceptance of the updated policy.`,
  },
  {
    icon: 'mail-outline' as const,
    title: '12. Contact Us',
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: privacy@hama.app
Support: support@hama.app
Website: https://hama.app

For data protection inquiries, you may also contact our designated privacy officer at privacy@hama.app.

We aim to respond to all privacy-related requests within 30 business days.`,
  },
];

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>
          <View style={styles.backBtn} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <FadeInView delay={0}>
          <View style={styles.heroSection}>
            <View style={styles.shieldWrap}>
              <LinearGradient colors={['rgba(255,107,0,0.2)', 'rgba(255,107,0,0.05)']} style={styles.shieldGrad}>
                <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Your Privacy Matters</Text>
            <Text style={styles.heroDesc}>We are committed to protecting your personal information and being transparent about how we collect, use, and share your data.</Text>
          </View>
        </FadeInView>

        {/* Last Updated */}
        <FadeInView delay={100}>
          <View style={styles.updatedBadge}>
            <Ionicons name="time-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.updatedText}>Last updated: August 2, 2026</Text>
          </View>
        </FadeInView>

        {/* Sections */}
        {SECTIONS.map((section, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <FadeInView key={index} delay={150 + index * 50}>
              <TouchableOpacity
                style={[styles.sectionCard, isExpanded && styles.sectionCardActive]}
                onPress={() => setExpandedIndex(isExpanded ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLeft}>
                    <View style={[styles.sectionIcon, isExpanded && styles.sectionIconActive]}>
                      <Ionicons name={section.icon} size={18} color={isExpanded ? COLORS.primary : COLORS.textSecondary} />
                    </View>
                    <Text style={[styles.sectionTitle, isExpanded && styles.sectionTitleActive]}>{section.title}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isExpanded ? COLORS.primary : COLORS.textTertiary}
                  />
                </View>
                {isExpanded && (
                  <View style={styles.sectionBody}>
                    <View style={styles.divider} />
                    <Text style={styles.sectionText}>{section.body}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </FadeInView>
          );
        })}

        {/* Contact CTA */}
        <FadeInView delay={800}>
          <View style={styles.contactCard}>
            <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Questions about your privacy?</Text>
              <Text style={styles.contactDesc}>Contact our privacy team at privacy@hama.app</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:privacy@hama.app')}>
              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </FadeInView>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, maxWidth: 1200, width: '100%', alignSelf: 'center' },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: SPACING.lg, paddingHorizontal: SPACING.md },
  shieldWrap: { marginBottom: SPACING.md },
  shieldGrad: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  heroDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20, textAlign: 'center' },

  // Updated badge
  updatedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: SPACING.lg,
  },
  updatedText: { color: COLORS.textTertiary, fontSize: 12 },

  // Sections
  sectionCard: {
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#2C2C2E',
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  sectionCardActive: { borderColor: COLORS.primary + '40' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionIconActive: { backgroundColor: 'rgba(255,107,0,0.15)' },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  sectionTitleActive: { color: COLORS.primary },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: '#2C2C2E', marginBottom: 12 },
  sectionText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20 },

  // Contact
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#2C2C2E',
    paddingHorizontal: 16, paddingVertical: 16,
    marginTop: SPACING.sm,
  },
  contactTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  contactBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,107,0,0.12)', justifyContent: 'center', alignItems: 'center',
  },
});
