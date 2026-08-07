/**
 * Landlord Upload Tracker
 *
 * Tracks the number of properties a landlord has uploaded.
 * First 3 uploads are free. After that, a subscription is required.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hama_landlord_uploads_v1';
const FREE_UPLOADS_LIMIT = 3;

export interface LandlordUploadState {
  propertyCount: number;
  freeUploadsRemaining: number;
  hasExceededFreeLimit: boolean;
}

let currentCount = 0;

export async function loadLandlordUploads(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentCount = parseInt(raw, 10) || 0;
    }
  } catch {
    currentCount = 0;
  }
  return currentCount;
}

export function getLandlordUploadState(): LandlordUploadState {
  const propertyCount = currentCount;
  const freeUploadsRemaining = Math.max(0, FREE_UPLOADS_LIMIT - propertyCount);
  const hasExceededFreeLimit = propertyCount >= FREE_UPLOADS_LIMIT;
  return { propertyCount, freeUploadsRemaining, hasExceededFreeLimit };
}

export async function incrementPropertyCount(): Promise<LandlordUploadState> {
  currentCount += 1;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, currentCount.toString());
  } catch {
    // silently fail
  }
  return getLandlordUploadState();
}

export async function resetPropertyCount(): Promise<void> {
  currentCount = 0;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function hasFreeUploadsRemaining(): boolean {
  return currentCount < FREE_UPLOADS_LIMIT;
}

export function getFreeUploadsRemaining(): number {
  return Math.max(0, FREE_UPLOADS_LIMIT - currentCount);
}
