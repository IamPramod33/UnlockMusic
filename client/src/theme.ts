import { useAuthStore } from './store';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
};

export function getThemeColors(themePref: 'light' | 'dark' | 'system' = 'light'): ThemeColors {
  const isDark = themePref === 'dark' ? true : themePref === 'light' ? false : false;
  if (isDark) {
    return {
      background: '#1E293B',
      card: '#0f172a',
      text: '#F8FAFC',
      muted: '#94A3B8',
      border: '#334155',
      primary: '#2563EB',
      success: '#22c55e',
      danger: '#EF4444',
    };
  }
  return {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    muted: '#475569',
    border: '#E5E7EB',
    primary: '#2563EB',
    success: '#16A34A',
    danger: '#DC2626',
  };
}

export function useThemeColors(): ThemeColors {
  const pref = useAuthStore((s) => s.preferences.theme);
  return getThemeColors(pref);
}


