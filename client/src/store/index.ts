import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type UserPreferences = {
  theme: 'light' | 'dark' | 'system';
  language: string;
  audioQuality: 'low' | 'medium' | 'high';
};

type CurrentUser = { id: string; email: string; name?: string; role?: string } | null;
type AuthState = {
  token: string | null;
  user: CurrentUser;
  preferences: UserPreferences;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: CurrentUser) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
};

const KEY_AUTH = 'auth_token';
const KEY_PREFS = 'user_prefs';

async function savePrefs(prefs: UserPreferences): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY_PREFS, JSON.stringify(prefs));
  } catch {}
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(KEY_PREFS, JSON.stringify(prefs));
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  preferences: { theme: 'system', language: 'en', audioQuality: 'high' },
  setToken: async (token: string | null) => {
    try {
      if (token) {
        await SecureStore.setItemAsync(KEY_AUTH, token);
        if (typeof window !== 'undefined') window.localStorage?.setItem(KEY_AUTH, token);
      } else {
        await SecureStore.deleteItemAsync(KEY_AUTH);
        if (typeof window !== 'undefined') window.localStorage?.removeItem(KEY_AUTH);
      }
    } catch {
      if (typeof window !== 'undefined') {
        if (token) window.localStorage?.setItem(KEY_AUTH, token);
        else window.localStorage?.removeItem(KEY_AUTH);
      }
    }
    set({ token });
  },
  setUser: (user: CurrentUser) => set({ user }),
  setPreferences: async (prefs: Partial<UserPreferences>) => {
    const next = { ...get().preferences, ...prefs } as UserPreferences;
    await savePrefs(next);
    set({ preferences: next });
  },
}));
