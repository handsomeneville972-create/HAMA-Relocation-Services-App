import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { ProviderPlanTier, ProviderProfile } from '../constants/types';
import {
  autosave,
  clearDraft,
  emptyProviderProfile,
  generateDashboardData,
  generateKeywords,
  loadDraft,
  loadProfile,
  saveProfile,
  validateStep,
} from '../services/providerOnboardingService';
import { PROVIDER_STEP_KEYS, ProviderStepKey } from '../services/providerOnboardingService';
import { normalizeProviderPlan } from '../services/providerOnboardingService';

interface ProviderContextValue {
  isHydrated: boolean;
  provider: ProviderProfile | null;
  draft: ProviderProfile | null;
  isProvider: boolean;
  onboardingComplete: boolean;
  updateDraft: (updates: Partial<ProviderProfile>) => void;
  setDraft: (draft: ProviderProfile) => void;
  markStepComplete: (step: ProviderStepKey) => void;
  stepValid: (step: ProviderStepKey) => boolean;
  activateProvider: (plan: ProviderPlanTier) => Promise<void>;
  logoutProvider: () => Promise<void>;
  getDashboardData: () => ReturnType<typeof generateDashboardData>;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [draft, setDraftState] = useState<ProviderProfile | null>(null);

  // ---------- Hydration ----------
  useEffect(() => {
    (async () => {
      try {
        const [saved, savedDraft] = await Promise.all([loadProfile(), loadDraft()]);
        if (saved) setProvider({ ...saved, plan: normalizeProviderPlan(saved.plan) });
        if (savedDraft) setDraftState({ ...savedDraft, plan: normalizeProviderPlan(savedDraft.plan) });
      } catch {
        // Corrupt storage — start fresh
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // ---------- Draft management ----------
  const updateDraft = useCallback(
    (updates: Partial<ProviderProfile>) => {
      setDraftState((prev) => {
        const next: ProviderProfile = prev ? { ...prev, ...updates } : { ...emptyProviderProfile(), ...updates };
        autosave(next);
        return next;
      });
    },
    []
  );

  const setDraft = useCallback((next: ProviderProfile) => {
    setDraftState(next);
    autosave(next);
  }, []);

  const markStepComplete = useCallback(
    (step: ProviderStepKey) => {
      setDraftState((prev) => {
        if (!prev) return prev;
        const completedSteps = Array.from(new Set([...prev.completedSteps, step]));
        const next = { ...prev, completedSteps };
        next.keywords = generateKeywords(next);
        autosave(next);
        return next;
      });
    },
    []
  );

  const stepValid = useCallback(
    (step: ProviderStepKey): boolean => {
      if (!draft) return false;
      return validateStep(step, draft).valid;
    },
    [draft]
  );

  // ---------- Activation ----------
  const activateProvider = useCallback(async (plan: ProviderPlanTier) => {
    setDraftState((currentDraft) => {
      const base = currentDraft || emptyProviderProfile();
      const now = new Date().toISOString();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      const completedSteps = [...PROVIDER_STEP_KEYS] as string[];
      const next: ProviderProfile = {
        ...base,
        id: base.id || `sp-${Date.now()}`,
        plan,
        status: 'active',
        subscriptionExpiry: expiry.toISOString(),
        completedSteps,
        onboardingComplete: true,
        keywords: generateKeywords(base),
        createdAt: base.createdAt || now,
        updatedAt: now,
        rating: 4.5,
        reviewCount: 0,
        completedJobs: 0,
        totalRevenue: 0,
        walletBalance: 0,
      };
      saveProfile(next);
      clearDraft();
      setProvider(next);
      setDraftState(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return null;
    });
  }, []);

  const logoutProvider = useCallback(async () => {
    setProvider(null);
    try {
      await AsyncStorage.removeItem('hama_provider_profile_v1');
    } catch {}
  }, []);

  const getDashboardData = useCallback(
    () => generateDashboardData(provider || emptyProviderProfile()),
    [provider]
  );

  const value = useMemo<ProviderContextValue>(
    () => ({
      isHydrated,
      provider,
      draft,
      isProvider: !!provider?.onboardingComplete,
      onboardingComplete: !!provider?.onboardingComplete,
      updateDraft,
      setDraft,
      markStepComplete,
      stepValid,
      activateProvider,
      logoutProvider,
      getDashboardData,
    }),
    [isHydrated, provider, draft, updateDraft, setDraft, markStepComplete, stepValid, activateProvider, logoutProvider, getDashboardData]
  );

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProvider(): ProviderContextValue {
  const ctx = useContext(ProviderContext);
  if (!ctx) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return ctx;
}
