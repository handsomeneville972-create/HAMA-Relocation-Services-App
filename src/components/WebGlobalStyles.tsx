import { useEffect } from 'react';
import { Platform } from 'react-native';
import { COLORS } from '../constants/theme';

const WEB_CSS = `
* {
  -webkit-tap-highlight-color: transparent;
}
html,
body,
#root {
  background-color: ${COLORS.bg};
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
  border: 2px solid ${COLORS.bg};
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.24);
}
:focus-visible {
  outline: 2px solid ${COLORS.primary};
  outline-offset: 2px;
  border-radius: 6px;
}
`;

/**
 * Injects global web-only polish (scrollbars, focus rings, tap highlight).
 * Renders nothing on native. Must be mounted once at the root layout.
 */
export function WebGlobalStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = WEB_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return null;
}
