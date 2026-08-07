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
  normalizeProviderPlan,
  PROVIDER_STEP_KEYS,
  ProviderStepKey,
  publishProviderProfile,
  saveProfile,
  validateStep,
} from '../services/providerOnboardingService';
import { getProviderProfileByUserId } from '../services/serviceProviderService';
import { useAuth } from './AuthContext';

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
  activateProvider: (plan?: ProviderPlanTier) => Promise<void>;
  logoutProvider: () => Promise<void>;
  getDashboardData: () => ReturnType<typeof generateDashboardData>;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [draft, setDraftState] = useState<ProviderProfile | null>(null);
  const { currentUserId } = useAuth();

  // ---------- Hydration ----------
  useEffect(() => {
    (async () => {
      try {
        const [saved, savedDraft] = await Promise.all([loadProfile(), loadDraft()]);
        if (saved) setProvider({ ...saved, plan: normalizeProviderPlan(saved.plan) });
        if (savedDraft) setDraftState({ ...savedDraft, plan: normalizeProviderPlan(savedDraft.plan) });

        // Published providers: prefer the canonical Supabase copy so
        // status/approval changes made elsewhere show up on launch.
        if (currentUserId && saved) {
          const { data: remote } = await getProviderProfileByUserId(currentUserId);
          if (remote) setProvider({ ...remote, plan: normalizeProviderPlan(remote.plan) });
        }
      } catch {
        // Corrupt storage — start fresh
      } finally {
        setIsHydrated(true);
      }
    })();
  }, [currentUserId]);

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

  // ---------- Activation (instant publish — free to join) ----------
  const activateProvider = useCallback(
    async (plan?: ProviderPlanTier) => {
      const selectedPlan = normalizeProviderPlan(plan || 'Basic');
      const base = draft || emptyProviderProfile();
      const now = new Date().toISOString();
      const completedSteps = [...PROVIDER_STEP_KEYS] as string[];
      const next: ProviderProfile = {
        ...base,
        id: base.id || `sp-${Date.now()}`,
        plan: selectedPlan,
        status: 'active',
        subscriptionExpiry: null,
        completedSteps,
        onboardingComplete: true,
        keywords: generateKeywords(base),
        createdAt: base.createdAt || now,
        updatedAt: now,
        rating: base.rating || 4.5,
        reviewCount: 0,
        completedJobs: 0,
        totalRevenue: 0,
        walletBalance: 0,
      };
      saveProfile(next);
      clearDraft();

      // Best-effort publish to Supabase; local profile always wins.
      if (currentUserId) {
        const res = await publishProviderProfile(next, currentUserId);
        if (!res.ok) {
          console.warn('[Provider] Supabase publish failed:', res.error);
        }
      }

      setProvider(next);
      setDraftState(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [currentUserId, draft]
  );

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
