import React, { useEffect } from 'react';
import { getSystemThemeMode } from './theme';
import useThemeStore from './useThemeStore';

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);

  useEffect(() => {
    initializeTheme(getSystemThemeMode());
  }, [initializeTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      syncSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [syncSystemTheme]);

  return <>{children}</>;
};

export default ThemeProvider;
