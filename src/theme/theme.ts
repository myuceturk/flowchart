export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export type CustomTheme = {
  primary: string;
  background: string;
  node: string;
  grid: string;
};

export type ThemeDefinition = {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    border: string;
    text: string;
    primary: string;
    secondary: string;
    canvas: string;
    canvasAlt: string;
    mutedText: string;
    overlay: string;
  };
};

export const lightTheme: ThemeDefinition = {
  mode: 'light',
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    border: 'rgba(148, 163, 184, 0.24)',
    text: '#0f172a',
    primary: '#2563eb',
    secondary: '#7c3aed',
    canvas: '#f8fafc',
    canvasAlt: '#eef2ff',
    mutedText: '#64748b',
    overlay: 'rgba(255, 255, 255, 0.82)',
  },
};

export const darkTheme: ThemeDefinition = {
  mode: 'dark',
  colors: {
    background: '#020617',
    surface: '#0f172a',
    border: 'rgba(148, 163, 184, 0.18)',
    text: '#e2e8f0',
    primary: '#38bdf8',
    secondary: '#a78bfa',
    canvas: '#0f172a',
    canvasAlt: '#111827',
    mutedText: '#94a3b8',
    overlay: 'rgba(15, 23, 42, 0.82)',
  },
};

export const themes: Record<ThemeMode, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme,
};

export const THEME_STORAGE_KEY = 'flow-builder-theme-preference';
export const CUSTOM_THEME_STORAGE_KEY = 'flow-builder-custom-theme';
export const defaultCustomTheme: CustomTheme = {
  primary: '#2563eb',
  background: '#f8fafc',
  node: '#eff6ff',
  grid: '#2563eb',
};

export function resolveTheme(mode: ThemeMode) {
  return themes[mode];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return fallback;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex, '#000000').slice(1);

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixColors(base: string, target: string, amount: number) {
  const safeAmount = clamp(amount, 0, 1);
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  return rgbToHex({
    r: baseRgb.r + (targetRgb.r - baseRgb.r) * safeAmount,
    g: baseRgb.g + (targetRgb.g - baseRgb.g) * safeAmount,
    b: baseRgb.b + (targetRgb.b - baseRgb.b) * safeAmount,
  });
}

function withAlpha(color: string, alpha: number) {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

export function sanitizeCustomTheme(partial?: Partial<CustomTheme> | null): CustomTheme {
  const rawGrid = partial?.grid?.trim();

  return {
    primary: normalizeHexColor(partial?.primary ?? defaultCustomTheme.primary, defaultCustomTheme.primary),
    background: normalizeHexColor(partial?.background ?? defaultCustomTheme.background, defaultCustomTheme.background),
    node: normalizeHexColor(partial?.node ?? defaultCustomTheme.node, defaultCustomTheme.node),
    grid: rawGrid?.startsWith('rgba(') || rawGrid?.startsWith('rgb(')
      ? rawGrid
      : normalizeHexColor(rawGrid ?? '#2563eb', '#2563eb'),
  };
}

export function getDefaultCustomTheme(mode: ThemeMode): CustomTheme {
  return mode === 'dark'
    ? {
        primary: darkTheme.colors.primary,
        background: darkTheme.colors.background,
        node: '#132033',
        grid: darkTheme.colors.primary,
      }
    : {
        primary: lightTheme.colors.primary,
        background: lightTheme.colors.background,
        node: '#eff6ff',
        grid: lightTheme.colors.primary,
      };
}

export function mergeThemeWithCustomizations(
  theme: ThemeDefinition,
  customTheme: CustomTheme,
): ThemeDefinition {
  const primary = normalizeHexColor(customTheme.primary, theme.colors.primary);
  const background = normalizeHexColor(customTheme.background, theme.colors.background);
  const darkAppearance = theme.mode === 'dark';
  const surface = mixColors(background, '#ffffff', darkAppearance ? 0.08 : 0.74);
  const canvasAlt = mixColors(background, primary, darkAppearance ? 0.12 : 0.08);
  const borderBase = darkAppearance ? '#cbd5e1' : '#334155';
  const text = darkAppearance ? '#e2e8f0' : '#0f172a';
  const mutedText = darkAppearance ? '#94a3b8' : '#64748b';

  return {
    ...theme,
    mode: theme.mode,
    colors: {
      ...theme.colors,
      primary,
      background,
      surface,
      canvas: background,
      canvasAlt,
      border: withAlpha(borderBase, 0.18),
      text,
      mutedText,
      overlay: withAlpha(surface, darkAppearance ? 0.84 : 0.8),
    },
  };
}

export function getSystemThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function buildThemeCssVariables(theme: ThemeDefinition, customTheme?: CustomTheme) {
  const sanitizedCustom = sanitizeCustomTheme(customTheme);
  const nodeSurface = normalizeHexColor(
    sanitizedCustom.node,
    theme.mode === 'dark' ? '#132033' : '#eff6ff',
  );
  const gridColor = sanitizedCustom.grid.startsWith('rgb')
    ? sanitizedCustom.grid
    : withAlpha(normalizeHexColor(sanitizedCustom.grid, theme.colors.primary), theme.mode === 'dark' ? 0.18 : 0.14);

  return {
    '--theme-bg': theme.colors.background,
    '--theme-surface': theme.colors.surface,
    '--theme-border': theme.colors.border,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.mutedText,
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-canvas': theme.colors.canvas,
    '--theme-canvas-alt': theme.colors.canvasAlt,
    '--theme-overlay': theme.colors.overlay,
    '--theme-header-bg':
      theme.mode === 'dark'
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.92) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%)',
    '--theme-header-text': theme.colors.text,
    '--theme-header-muted': theme.colors.mutedText,
    '--theme-header-shadow':
      theme.mode === 'dark'
        ? '0 14px 28px rgba(2, 6, 23, 0.14)'
        : '0 14px 28px rgba(15, 23, 42, 0.08)',
    '--theme-sidebar-bg':
      theme.mode === 'dark'
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.92) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.92) 100%)',
    '--theme-sidebar-panel':
      theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.76)' : 'rgba(255, 255, 255, 0.76)',
    '--theme-sidebar-panel-strong':
      theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
    '--theme-sidebar-text': theme.colors.text,
    '--theme-sidebar-text-muted': theme.colors.mutedText,
    '--theme-sidebar-hover':
      theme.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)',
    '--theme-sidebar-active':
      theme.mode === 'dark' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(37, 99, 235, 0.1)',
    '--theme-menu-bg':
      theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    '--theme-menu-text': theme.colors.text,
    '--theme-menu-shadow':
      theme.mode === 'dark'
        ? '0 22px 50px rgba(2, 6, 23, 0.45), 0 8px 18px rgba(2, 6, 23, 0.24)'
        : '0 22px 50px rgba(15, 23, 42, 0.22), 0 8px 18px rgba(15, 23, 42, 0.1)',
    '--theme-toolbar-bg': theme.colors.overlay,
    '--theme-toolbar-text': theme.colors.text,
    '--theme-selection-bg':
      theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)',
    '--theme-selection-text': theme.colors.text,
    '--theme-node-label': theme.colors.text,
    '--theme-node-surface': nodeSurface,
    '--theme-grid-color': gridColor,
    '--theme-edge-color': theme.mode === 'dark' ? '#94a3b8' : '#334155',
  } as const;
}
