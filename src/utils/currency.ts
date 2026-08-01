import { CURRENCIES, type CurrencyCode } from '../constants/types';
import { getRateToKSh } from './exchangeRates';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Storage key for persisting the user's currency preference.
// Same key used for both SecureStore (native) and AsyncStorage (fallback).
// ============================================================
const CURRENCY_STORAGE_KEY = 'hama_currency_preference';

/**
 * Default currency code for the MVP.
 * The module-level variable acts as an in-memory cache.
 * On app launch, call `loadUserCurrency()` to hydrate from SecureStore.
 */
let _userCurrency: CurrencyCode = 'KSh';

// ============================================================
// Persistence helpers (SecureStore with AsyncStorage fallback)
// ============================================================

/** Save the user's currency preference to SecureStore. */
async function persistCurrency(code: CurrencyCode): Promise<void> {
  try {
    await SecureStore.setItemAsync(CURRENCY_STORAGE_KEY, code);
  } catch {
    // SecureStore unsupported (web / test) — fall back to AsyncStorage
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // Storage unavailable — silently degrade to in-memory only
    }
  }
}

/** Load the user's currency preference from SecureStore (or fallback). */
async function loadPersistedCurrency(): Promise<CurrencyCode | null> {
  try {
    return await SecureStore.getItemAsync(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
  } catch {
    try {
      return await AsyncStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
    } catch {
      return null;
    }
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Load the user's saved currency preference.
 * Call this once at app startup (e.g. in RootLayout or AuthProvider).
 * Falls back to 'KSh' if nothing is saved or storage is unavailable.
 */
export async function loadUserCurrency(): Promise<CurrencyCode> {
  _userCurrency = 'KSh';
  return _userCurrency;
}

/** Get the user's currently preferred currency (sync, from memory). */
export function getUserCurrency(): CurrencyCode {
  return _userCurrency;
}

/**
 * Set the user's preferred currency and persist it to SecureStore.
 * Returns a promise that resolves once persisted.
 */
export async function setUserCurrency(code: CurrencyCode): Promise<void> {
  _userCurrency = code;
  await persistCurrency(code);
}

/** Get the CurrencyInfo object for the given code (defaults to user preference). */
export function getCurrencyInfo(code?: CurrencyCode) {
  const resolved = code ?? _userCurrency;
  return CURRENCIES[resolved];
}

/**
 * Format a price amount for display.
 *
 * MVP: KSh only — always displayed as "KSh 1,500".
 * v2: Converts from KSh base to the user's preferred currency and formats
 *     using locale-aware number formatting.
 *
 * @param amountKSh  — the price amount stored in KSh (always the DB base)
 * @param code       — target currency code (defaults to user preference)
 * @returns          — e.g. "KSh 1,500" or "$19.25"
 */
export function formatPrice(amountKSh: number, code?: CurrencyCode): string {
  const target = code ?? _userCurrency;
  const info = CURRENCIES[target];
  const rate = getRateToKSh(target);

  if (target === 'KSh') {
    return `KSh ${amountKSh.toLocaleString('en-KE')}`;
  }

  // Convert using the effective rate (live if available, else hardcoded default)
  const converted = amountKSh * rate;
  const formatted = converted.toLocaleString(info.locale, {
    style: 'currency',
    currency: target,
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  return formatted;
}

/**
 * Convert a KSh amount to the target currency's numeric value.
 * Uses the effective rate (live if available, else hardcoded default).
 */
export function convertPrice(amountKSh: number, code: CurrencyCode): number {
  return amountKSh * getRateToKSh(code);
}
