/**
 * HAMA™ Early Access Context
 *
 * Manages the state of the Early Access Program UI:
 * - Premium modal visibility (shown when users click upgrade/subscribe CTAs)
 * - Banner dismiss state (persisted across sessions)
 * - Dashboard welcome card state
 * - Waitlist, referral, and email capture state
 * - Analytics tracking
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { logEvent, trackBannerDismissed } from '../utils/analytics';
import type { ReferralStats, WaitlistEntry, PreferredPlan } from '../constants/types';
import { waitlistService, referralService, emailCaptureService } from '../services/earlyAccessService';

// ---------- Constants ----------

const BANNER_DISMISSED_KEY = '@hama/early_access_banner_dismissed';
const WELCOME_CARD_DISMISSED_KEY = '@hama/early_access_welcome_card_dismissed';
const EMAIL_CAPTURE_DISMISSED_KEY = '@hama/email_capture_dismissed';

// ---------- Types ----------

interface EarlyAccessContextType {
  /** Whether the premium modal is visible */
  isPremiumModalVisible: boolean;
  /** Show the Early Access premium modal */
  showPremiumModal: () => void;
  /** Hide the Early Access premium modal */
  hidePremiumModal: () => void;
  /** Whether the banner is dismissed */
  isBannerDismissed: boolean;
  /** Dismiss the banner (persisted) */
  dismissBanner: () => void;
  /** Whether the dashboard welcome card is dismissed */
  isWelcomeCardDismissed: boolean;
  /** Dismiss the dashboard welcome card (persisted) */
  dismissWelcomeCard: () => void;
  /** Whether early access is active */
  isEarlyAccessActive: boolean;

  // ----- Waitlist -----
  /** Whether the waitlist modal is visible */
  isWaitlistVisible: boolean;
  /** Show the waitlist form */
  showWaitlist: () => void;
  /** Hide the waitlist form */
  hideWaitlist: () => void;
  /** Submit a waitlist entry */
  submitWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'intent'>) => Promise<WaitlistEntry>;
  /** Waitlist entry count */
  waitlistCount: number;

  // ----- Referral -----
  /** Referral stats for current user */
  referralStats: ReferralStats | null;
  /** Load referral stats */
  loadReferralStats: (userId: string) => Promise<void>;
  /** Record a referral */
  recordReferral: (referredEmail: string, referredName?: string) => Promise<void>;

  // ----- Email Capture -----
  /** Whether the email capture is dismissed */
  isEmailCaptureDismissed: boolean;
  /** Dismiss the email capture */
  dismissEmailCapture: () => void;
  /** Subscribe to emails */
  subscribeToEmails: (email: string, name?: string, userId?: string) => Promise<void>;
}

// ---------- Context ----------

const EarlyAccessContext = createContext<EarlyAccessContextType | null>(null);

// ---------- Provider ----------

export const EarlyAccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isWelcomeCardDismissed, setIsWelcomeCardDismissed] = useState(false);
  const [isWaitlistVisible, setIsWaitlistVisible] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isEmailCaptureDismissed, setIsEmailCaptureDismissed] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const isEarlyAccessActive = EARLY_ACCESS_CONFIG.EARLY_ACCESS_ACTIVE;

  // Restore persisted state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const [bannerDismissed, welcomeCardDismissed, emailDismissed] = await Promise.all([
          AsyncStorage.getItem(BANNER_DISMISSED_KEY),
          AsyncStorage.getItem(WELCOME_CARD_DISMISSED_KEY),
          AsyncStorage.getItem(EMAIL_CAPTURE_DISMISSED_KEY),
        ]);

        if (bannerDismissed) setIsBannerDismissed(true);
        if (welcomeCardDismissed) setIsWelcomeCardDismissed(true);
        if (emailDismissed) setIsEmailCaptureDismissed(true);

        // Load waitlist count
        const count = await waitlistService.getCount();
        setWaitlistCount(count);
      } catch {
        // Silent fail
      } finally {
        setIsInitialized(true);
      }
    };

    restoreState();
  }, []);

  // ===== Premium Modal =====
  const showPremiumModal = useCallback(() => {
    if (isEarlyAccessActive) {
      setIsPremiumModalVisible(true);
      logEvent('early_access_modal_viewed');
    }
  }, [isEarlyAccessActive]);

  const hidePremiumModal = useCallback(() => {
    setIsPremiumModalVisible(false);
  }, []);

  // ===== Banner =====
  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    trackBannerDismissed();
    AsyncStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString()).catch(() => {});
  }, []);

  // ===== Welcome Card =====
  const dismissWelcomeCard = useCallback(() => {
    setIsWelcomeCardDismissed(true);
    logEvent('dashboard_welcome_card_dismissed');
    AsyncStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true').catch(() => {});
  }, []);

  // ===== Waitlist =====
  const showWaitlist = useCallback(() => {
    setIsWaitlistVisible(true);
    logEvent('waitlist_modal_viewed');
  }, []);

  const hideWaitlist = useCallback(() => {
    setIsWaitlistVisible(false);
  }, []);

  const submitWaitlist = useCallback(async (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'intent'>) => {
    const result = await waitlistService.add(entry);
    setWaitlistCount(prev => prev + 1);
    setIsWaitlistVisible(false);
    logEvent('waitlist_submitted', { preferred_plan: entry.preferredPlan });
    return result;
  }, []);

  // ===== Referral =====
  const loadReferralStats = useCallback(async (userId: string) => {
    const stats = await referralService.getStats(userId);
    setReferralStats(stats);
  }, []);

  const recordReferral = useCallback(async (referredEmail: string, referredName?: string) => {
    // Stats will be reloaded after recording
  }, []);

  // ===== Feature Request =====

  // ===== Email Capture =====
  const dismissEmailCapture = useCallback(() => {
    setIsEmailCaptureDismissed(true);
    logEvent('email_capture_dismissed');
    AsyncStorage.setItem(EMAIL_CAPTURE_DISMISSED_KEY, 'true').catch(() => {});
  }, []);

  const subscribeToEmails = useCallback(async (email: string, name?: string, userId?: string) => {
    await emailCaptureService.subscribe(email, name, userId);
    setIsEmailCaptureDismissed(true);
    logEvent('email_capture_subscribed');
  }, []);

  return (
    <EarlyAccessContext.Provider
      value={{
        isPremiumModalVisible,
        showPremiumModal,
        hidePremiumModal,
        isBannerDismissed: isInitialized ? isBannerDismissed : false,
        dismissBanner,
        isWelcomeCardDismissed: isInitialized ? isWelcomeCardDismissed : false,
        dismissWelcomeCard,
        isEarlyAccessActive,

        // Waitlist
        isWaitlistVisible,
        showWaitlist,
        hideWaitlist,
        submitWaitlist,
        waitlistCount,

        // Referral
        referralStats,
        loadReferralStats,
        recordReferral,

        // Email Capture
        isEmailCaptureDismissed: isInitialized ? isEmailCaptureDismissed : false,
        dismissEmailCapture,
        subscribeToEmails,
      }}
    >
      {children}
    </EarlyAccessContext.Provider>
  );
};

// ---------- Hook ----------

export const useEarlyAccess = (): EarlyAccessContextType => {
  const ctx = useContext(EarlyAccessContext);
  if (!ctx) {
    throw new Error('useEarlyAccess must be used within an EarlyAccessProvider');
  }
  return ctx;
};
