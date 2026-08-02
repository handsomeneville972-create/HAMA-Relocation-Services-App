/**
 * HAMA Workspaces Store
 *
 * Shared in-memory store for the user's active workspace plans
 * (house_seeker, landlord, seller, service_provider), persisted to
 * AsyncStorage so Profile and Workspace Plans stay in sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkspaceRole = 'house_seeker' | 'landlord' | 'seller' | 'service_provider';

const STORAGE_KEY = 'hama_workspaces_v1';

let activeWorkspaces: WorkspaceRole[] = ['house_seeker'];

type Listener = (workspaces: WorkspaceRole[]) => void;
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((l) => l([...activeWorkspaces]));
}

/** Load persisted workspaces from storage (call once at app start). */
export async function loadWorkspaces(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceRole[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged: WorkspaceRole[] = ['house_seeker', ...parsed.filter((w) => w !== 'house_seeker')];
        activeWorkspaces = merged.filter((w, i) => merged.indexOf(w) === i);
      }
    }
  } catch {
    // fall back to defaults
  }
  emit();
}

/** Get the current list of active workspaces, house_seeker first. */
export function getActiveWorkspaces(): WorkspaceRole[] {
  return [...activeWorkspaces];
}

/** Check whether a workspace is active. */
export function isWorkspaceActive(role: WorkspaceRole): boolean {
  return activeWorkspaces.includes(role);
}

/** Activate a workspace and persist. */
export async function activateWorkspace(role: WorkspaceRole): Promise<void> {
  if (!activeWorkspaces.includes(role)) {
    activeWorkspaces = [...activeWorkspaces, role];
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeWorkspaces));
  } catch {
    // storage unavailable — keep in-memory state
  }
  emit();
}

/** Subscribe to workspace changes; returns an unsubscribe fn. */
export function subscribeWorkspaces(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/** Short human-readable label for a workspace role. */
export function workspaceLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'house_seeker': return 'House Seeker';
    case 'landlord': return 'Landlord';
    case 'seller': return 'Seller';
    case 'service_provider': return 'Service Provider';
  }
}
