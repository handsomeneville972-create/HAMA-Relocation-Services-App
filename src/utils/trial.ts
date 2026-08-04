/**
 * HAMA Seeker Free Trial Store
 *
 * A 7-day free trial of Premium (seekers only). Persisted to AsyncStorage
 * so the countdown, entitlement and the trial-ended popup stay consistent
 * across sessions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEEKER_TRIAL_DAYS } from '../constants/plans';

const STORAGE_KEY = 'hama_trial_v1';

export type TrialStatus = 'none' | 'active' | 'expired';

export interface TrialState {
  status: TrialStatus;
  startedAt: string | null;
  expiresAt: string | null;
  daysLeft: number;
}

let trial: TrialState = {
  status: 'none',
  startedAt: null,
  expiresAt: null,
  daysLeft: 0,
};

type Listener = (state: TrialState) => void;
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((l) => l({ ...trial }));
}

function computeDaysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

/** Load persisted trial from storage (call once at app start). */
export async function loadTrial(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { startedAt: string; expiresAt: string };
      const daysLeft = computeDaysLeft(parsed.expiresAt);
      trial = {
        startedAt: parsed.startedAt,
        expiresAt: parsed.expiresAt,
        daysLeft,
        status: daysLeft > 0 ? 'active' : 'expired',
      };
    }
  } catch {
    // fall back to defaults
  }
  emit();
}

/** Current trial state. */
export function getTrialState(): TrialState {
  return { ...trial };
}

/** Start the 7-day trial (no-op if already started). */
export async function startTrial(): Promise<TrialState> {
  if (trial.status === 'active') return { ...trial };

  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SEEKER_TRIAL_DAYS * 86_400_000).toISOString();
  trial = {
    status: 'active',
    startedAt,
    expiresAt,
    daysLeft: SEEKER_TRIAL_DAYS,
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ startedAt, expiresAt }));
  } catch {
    // keep in-memory state
  }
  emit();
  return { ...trial };
}

/** Subscribe to trial changes; returns an unsubscribe fn. */
export function subscribeTrial(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
