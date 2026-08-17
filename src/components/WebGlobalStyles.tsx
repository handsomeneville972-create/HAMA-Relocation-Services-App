import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';

function buildWebCss(colors: ThemeColors): string {
  return `
* {
  -webkit-tap-highlight-color: transparent;
}
html,
body,
#root {
  background-color: ${colors.bg};
}
html {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  border: 2px solid ${colors.bg};
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.24);
}
:focus-visible {
  outline: 2px solid ${colors.primary};
  outline-offset: 2px;
  border-radius: 6px;
}
`;
}

/**
 * Injects global web-only polish (scrollbars, focus rings, tap highlight).
 * Rebuilds whenever the active theme changes. Renders nothing on native.
 * Must be mounted once at the root layout (inside ThemeProvider).
 */
export function WebGlobalStyles() {
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = buildWebCss(colors);
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [colors, mode]);

  return null;
}
