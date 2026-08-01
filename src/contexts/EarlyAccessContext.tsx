/**
 * HAMA™ Early Access Context
 *
 * Manages shared state for:
 * - Waitlist, referral, and email capture state
 * - Analytics tracking
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from '../utils/analytics';
import type { WaitlistEntry, PreferredPlan } from '../constants/types';
import { waitlistService, emailCaptureService } from '../services/earlyAccessService';

// ---------- Constants ----------

const EMAIL_CAPTURE_DISMISSED_KEY = '@hama/email_capture_dismissed';

// ---------- Types ----------

interface EarlyAccessContextType {
  /** Whether early access is active */
  isEarlyAccessActive: boolean;

  // ----- Premium Modal (noop — early access badges removed) -----
  isPremiumModalVisible: boolean;
  showPremiumModal: () => void;
  hidePremiumModal: () => void;

  // ----- Banner (noop — early access banner removed) -----
  isBannerDismissed: boolean;
  dismissBanner: () => void;

  // ----- Welcome Card (noop — early access welcome card removed) -----
  isWelcomeCardDismissed: boolean;
  dismissWelcomeCard: () => void;

  // ----- Waitlist -----
  isWaitlistVisible: boolean;
  showWaitlist: () => void;
  hideWaitlist: () => void;
  submitWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'intent'>) => Promise<WaitlistEntry>;
  waitlistCount: number;

  // ----- Email Capture -----
  isEmailCaptureDismissed: boolean;
  dismissEmailCapture: () => void;
  subscribeToEmails: (email: string, name?: string, userId?: string) => Promise<void>;
}

// ---------- Context ----------

const EarlyAccessContext = createContext<EarlyAccessContextType | null>(null);

// ---------- Provider ----------

export const EarlyAccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEmailCaptureDismissed, setIsEmailCaptureDismissed] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const isEarlyAccessActive = true;

  // Restore persisted state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const emailDismissed = await AsyncStorage.getItem(EMAIL_CAPTURE_DISMISSED_KEY);
        if (emailDismissed) setIsEmailCaptureDismissed(true);
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

  // ===== Premium Modal (noop) =====
  const showPremiumModal = useCallback(() => {}, []);
  const hidePremiumModal = useCallback(() => {}, []);

  // ===== Banner (noop) =====
  const dismissBanner = useCallback(() => {}, []);

  // ===== Welcome Card (noop) =====
  const dismissWelcomeCard = useCallback(() => {}, []);

  // ===== Waitlist =====
  const showWaitlist = useCallback(() => {
    logEvent('waitlist_modal_viewed');
  }, []);

  const hideWaitlist = useCallback(() => {}, []);

  const submitWaitlist = useCallback(async (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'intent'>) => {
    const result = await waitlistService.add(entry);
    setWaitlistCount(prev => prev + 1);
    logEvent('waitlist_submitted', { preferred_plan: entry.preferredPlan });
    return result;
  }, []);

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
        isEarlyAccessActive,
        isPremiumModalVisible: false,
        showPremiumModal,
        hidePremiumModal,
        isBannerDismissed: true,
        dismissBanner,
        isWelcomeCardDismissed: true,
        dismissWelcomeCard,
        isWaitlistVisible: false,
        showWaitlist,
        hideWaitlist,
        submitWaitlist,
        waitlistCount,
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
