import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, COLORS, type ThemeColors } from '../constants/theme';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'hama_theme';
const THEMES: Record<ThemeMode, ThemeColors> = { dark: darkColors, light: lightColors };

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [hydrated, setHydrated] = useState(false);

  const applyMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    // Keep the static COLORS shim in sync so render-time COLORS.x usages
    // in not-yet-migrated files stay reactive.
    Object.assign(COLORS, THEMES[next]);
  }, []);

  // Hydrate the saved theme before first paint to avoid a theme flash.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (active && (saved === 'dark' || saved === 'light')) {
          applyMode(saved);
        }
      } catch {
        // Storage unavailable — fall back to default dark
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyMode]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      applyMode(next);
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
    },
    [applyMode],
  );

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: THEMES[mode],
      isDark: mode === 'dark',
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  // Wait for hydration so persisted light-theme users don't flash dark.
  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
