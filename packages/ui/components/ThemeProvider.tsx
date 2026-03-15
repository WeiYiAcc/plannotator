import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import { BUILT_IN_THEMES, type ThemeInfo } from '../utils/themeRegistry';

export type Mode = 'dark' | 'light' | 'system';

type ThemeProviderState = {
  // Mode (dark/light/system) — backward-compatible with old "theme" API
  theme: Mode;
  setTheme: (mode: Mode) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  resolvedMode: 'dark' | 'light';
  // Color theme (palette)
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  availableThemes: ThemeInfo[];
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'dark',
  setTheme: () => null,
  mode: 'dark',
  setMode: () => null,
  resolvedMode: 'dark',
  colorTheme: 'plannotator',
  setColorTheme: () => null,
  availableThemes: BUILT_IN_THEMES,
});

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Mode;
  defaultColorTheme?: string;
  storageKey?: string;
  colorThemeStorageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultColorTheme = 'plannotator',
  storageKey = 'plannotator-theme',
  colorThemeStorageKey = 'plannotator-color-theme',
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<Mode>(
    () => (storage.getItem(storageKey) as Mode) || defaultTheme
  );

  const [colorTheme, setColorThemeState] = useState<string>(
    () => storage.getItem(colorThemeStorageKey) || defaultColorTheme
  );

  const [systemIsLight, setSystemIsLight] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
  );

  // Compute resolved mode once — consumers use this instead of re-querying matchMedia
  const resolvedMode: 'dark' | 'light' = mode === 'system' ? (systemIsLight ? 'light' : 'dark') : mode;

  // Resolve classes from resolved mode + theme's modeSupport
  const resolveClasses = useCallback((effectiveMode: 'dark' | 'light') => {
    const themeInfo = BUILT_IN_THEMES.find(t => t.id === colorTheme);
    const modeSupport = themeInfo?.modeSupport ?? 'both';

    let applyLight = effectiveMode === 'light';
    if (modeSupport === 'dark-only') applyLight = false;
    if (modeSupport === 'light-only') applyLight = true;

    return `theme-${colorTheme}${applyLight ? ' light' : ''}`;
  }, [colorTheme]);

  // Apply theme class + mode class to document element
  useEffect(() => {
    window.document.documentElement.className = resolveClasses(resolvedMode);
  }, [resolvedMode, resolveClasses]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => setSystemIsLight(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = useCallback((newMode: Mode) => {
    storage.setItem(storageKey, newMode);
    setModeState(newMode);
  }, [storageKey]);

  const setColorTheme = useCallback((newTheme: string) => {
    storage.setItem(colorThemeStorageKey, newTheme);
    setColorThemeState(newTheme);
  }, [colorThemeStorageKey]);

  const value = useMemo<ThemeProviderState>(() => ({
    theme: mode,
    setTheme: setMode,
    mode,
    setMode,
    resolvedMode,
    colorTheme,
    setColorTheme,
    availableThemes: BUILT_IN_THEMES,
  }), [mode, resolvedMode, colorTheme, setMode, setColorTheme]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
