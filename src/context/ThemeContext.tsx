import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  pageBg: string;
  headerBg: string;
  sidebarBg: string;
  cardBg: string;
  panelBg: string;
  inputBg: string;
  borderMain: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryAccent: string;
  cyanAccent: string;
  success: string;
  warning: string;
  danger: string;
  purple: string;
}

export const THEME_COLORS: Record<ThemeMode, ThemeColors> = {
  light: {
    pageBg: '#F4F6F8',
    headerBg: '#FFFFFF',
    sidebarBg: '#FFFFFF',
    cardBg: '#FFFFFF',
    panelBg: '#F8FAFC',
    inputBg: '#FFFFFF',
    borderMain: '#E2E8F0',
    borderSubtle: '#EDF2F7',
    textPrimary: '#172033',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    primaryAccent: '#0891B2',
    cyanAccent: '#0891B2',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#7C3AED'
  },
  dark: {
    pageBg: '#0B1220',
    headerBg: '#0D1628',
    sidebarBg: '#0D1628',
    cardBg: '#111B2E',
    panelBg: '#151F32',
    inputBg: '#0D1628',
    borderMain: '#243149',
    borderSubtle: '#1C273C',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primaryAccent: '#06B6D4',
    cyanAccent: '#06B6D4',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#A855F7'
  }
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
    return 'light'; // Light theme default
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('apex_plm_theme_mode', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const colors = THEME_COLORS[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
