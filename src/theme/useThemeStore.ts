import { create } from 'zustand';
import {
  CUSTOM_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  buildThemeCssVariables,
  getDefaultCustomTheme,
  mergeThemeWithCustomizations,
  resolveTheme,
  sanitizeCustomTheme,
  type CustomTheme,
  type ThemeDefinition,
  type ThemeMode,
  type ThemePreference,
} from './theme';

type ThemeState = {
  preference: ThemePreference;
  mode: ThemeMode;
  theme: ThemeDefinition;
  customTheme: CustomTheme;
  initialized: boolean;
  initializeTheme: (systemMode: ThemeMode) => void;
  setTheme: (mode: ThemeMode) => void;
  updateCustomTheme: (updates: Partial<CustomTheme>) => void;
  resetCustomTheme: () => void;
  syncSystemTheme: (mode: ThemeMode) => void;
};

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function persistPreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

function persistCustomTheme(customTheme: CustomTheme) {
  window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(customTheme));
}

function readStoredCustomTheme(mode: ThemeMode) {
  const fallback = getDefaultCustomTheme(mode);
  const saved = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);

  if (!saved) {
    return fallback;
  }

  try {
    return sanitizeCustomTheme({
      ...fallback,
      ...(JSON.parse(saved) as Partial<CustomTheme>),
    });
  } catch {
    return fallback;
  }
}

function hasCustomThemeOverrides(customTheme: CustomTheme, mode: ThemeMode) {
  const normalized = sanitizeCustomTheme(customTheme);
  const defaults = getDefaultCustomTheme(mode);

  return (
    normalized.primary !== defaults.primary ||
    normalized.background !== defaults.background ||
    normalized.node !== defaults.node ||
    normalized.grid !== defaults.grid
  );
}

function applyThemeToDocument(
  theme: ThemeDefinition,
  preference: ThemePreference,
  customTheme: CustomTheme,
) {
  const root = document.documentElement;
  const variables = buildThemeCssVariables(theme, customTheme);

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.dataset.theme = theme.mode;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme.mode;
}

const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  mode: 'light',
  theme: resolveTheme('light'),
  customTheme: getDefaultCustomTheme('light'),
  initialized: false,
  initializeTheme: (systemMode) => {
    if (get().initialized) {
      return;
    }

    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const preference: ThemePreference = isThemePreference(saved) ? saved : 'system';
    const mode = preference === 'system' ? systemMode : preference;
    const customTheme = readStoredCustomTheme(mode);
    const theme = mergeThemeWithCustomizations(resolveTheme(mode), customTheme);

    set({ preference, mode, theme, customTheme, initialized: true });
    applyThemeToDocument(theme, preference, customTheme);
  },
  setTheme: (mode) => {
    const { mode: currentMode, customTheme: currentCustomTheme } = get();
    const customTheme = hasCustomThemeOverrides(currentCustomTheme, currentMode)
      ? currentCustomTheme
      : getDefaultCustomTheme(mode);
    const theme = mergeThemeWithCustomizations(resolveTheme(mode), customTheme);

    persistPreference(mode);
    persistCustomTheme(customTheme);
    set({ preference: mode, mode, theme, customTheme });
    applyThemeToDocument(theme, mode, customTheme);
  },
  updateCustomTheme: (updates) => {
    const customTheme = sanitizeCustomTheme({
      ...get().customTheme,
      ...updates,
    });
    const theme = mergeThemeWithCustomizations(resolveTheme(get().mode), customTheme);

    persistCustomTheme(customTheme);
    set({ customTheme, theme });
    applyThemeToDocument(theme, get().preference, customTheme);
  },
  resetCustomTheme: () => {
    const customTheme = getDefaultCustomTheme(get().mode);
    const theme = mergeThemeWithCustomizations(resolveTheme(get().mode), customTheme);

    persistCustomTheme(customTheme);
    set({ customTheme, theme });
    applyThemeToDocument(theme, get().preference, customTheme);
  },
  syncSystemTheme: (mode) => {
    if (get().preference !== 'system') {
      return;
    }

    const { mode: currentMode, customTheme: currentCustomTheme } = get();
    const customTheme = hasCustomThemeOverrides(currentCustomTheme, currentMode)
      ? currentCustomTheme
      : getDefaultCustomTheme(mode);
    const theme = mergeThemeWithCustomizations(resolveTheme(mode), customTheme);

    persistCustomTheme(customTheme);
    set({ mode, theme, customTheme });
    applyThemeToDocument(theme, 'system', customTheme);
  },
}));

export default useThemeStore;
