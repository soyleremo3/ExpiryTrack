// Theme: colors, the light/dark/system preference, and a hook for the few
// places a raw color value is needed instead of a class.
//
// Most styling flips automatically: screens use semantic NativeWind classes
// (bg-background, text-body, …) backed by CSS variables supplied at runtime
// by a `vars()` provider at the root of App.tsx. Some React Native props take
// a color value and can't be a class — ActivityIndicator's `color`,
// navigator screenOptions, StatusBar. Those read the matching hex from
// `useThemeColors()` so they track the theme too.
//
// Theme is driven by our own React Context/state rather than NativeWind's
// `useColorScheme()`/`colorScheme.set()` — that API is deprecated upstream in
// favor of React Native's own read-only hook, and a plain Context is trivially
// correct in Expo Go, a dev client, or a production build alike. `vars()`
// itself is kept — it's still the documented way to hand CSS variable values
// to a subtree.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { vars } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STATUS_COLORS } from './constants';
import type { ExpiryStatus } from '../types';

export const ACCENT = '#4F46E5'; // indigo-600 — same accent in both themes

export type ThemeColors = {
  isDark: boolean;
  accent: string;
  bg: string;
  surface: string;
  surface2: string;
  hairline: string;
  body: string;
  muted: string;
  faint: string;
};

// Runtime equivalents of the CSS variables below. Keep these in sync — same
// palette, just consumable from JS for native props.
const LIGHT: ThemeColors = {
  isDark: false,
  accent: ACCENT,
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  hairline: '#E2E8F0',
  body: '#0F172A',
  muted: '#475569',
  faint: '#94A3B8',
};

const DARK: ThemeColors = {
  isDark: true,
  accent: '#818CF8', // indigo-400 — lighter for contrast on a dark surface
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#0F172A',
  hairline: '#334155',
  body: '#F8FAFC',
  muted: '#CBD5E1',
  faint: '#64748B',
};

// The CSS variables that back the semantic Tailwind classes (bg-background,
// text-body, …), supplied at runtime by the root wrapper in App.tsx. Channel
// values must match global.css / the LIGHT + DARK palettes above.
export const LIGHT_VARS = vars({
  '--accent': '79 70 229',
  '--bg': '248 250 252',
  '--surface': '255 255 255',
  '--surface-2': '241 245 249',
  '--hairline': '226 232 240',
  '--body': '15 23 42',
  '--muted': '71 85 105',
  '--faint': '148 163 184',
});

export const DARK_VARS = vars({
  '--accent': '129 140 248',
  '--bg': '15 23 42',
  '--surface': '30 41 59',
  '--surface-2': '15 23 42',
  '--hairline': '51 65 85',
  '--body': '248 250 252',
  '--muted': '203 213 225',
  '--faint': '100 116 139',
});

// ------------------------------------------------------------- preference

export type ThemePref = 'light' | 'dark' | 'system';

const THEME_PREF_KEY = 'expirytrack.themePref';
export const DEFAULT_THEME_PREF: ThemePref = 'system';

export async function loadThemePref(): Promise<ThemePref> {
  try {
    const saved = await AsyncStorage.getItem(THEME_PREF_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // storage unavailable — fall back to the default
  }
  return DEFAULT_THEME_PREF;
}

export async function saveThemePref(pref: ThemePref): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_PREF_KEY, pref);
  } catch {
    // best effort; the in-memory preference is already applied by the caller
  }
}

// --------------------------------------------------------------- provider

type ThemeContextValue = {
  pref: ThemePref;
  isDark: boolean;
  setPref: (pref: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  pref: DEFAULT_THEME_PREF,
  isDark: false,
  setPref: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme(); // OS scheme; only consulted for 'system'
  const [pref, setPrefState] = useState<ThemePref>(DEFAULT_THEME_PREF);

  useEffect(() => {
    loadThemePref().then(setPrefState);
  }, []);

  function setPref(next: ThemePref) {
    setPrefState(next);
    saveThemePref(next);
  }

  const isDark = pref === 'system' ? system === 'dark' : pref === 'dark';
  const value = useMemo(() => ({ pref, isDark, setPref }), [pref, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The user's raw light/dark/system choice plus the resolved boolean and a
// setter — for the Settings screen's segmented control.
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// Raw colors for the current scheme. Re-renders when the theme changes.
export function useThemeColors(): ThemeColors {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}

// Raw status color (expired/today/critical/soon/fresh) for the current
// scheme — for native props that can't take a Tailwind class.
export function useStatusColor(status: ExpiryStatus): string {
  const { isDark } = useTheme();
  return STATUS_COLORS[isDark ? 'dark' : 'light'][status];
}
