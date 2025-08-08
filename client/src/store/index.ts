import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type CurrentUser = { id: string; email: string; name?: string; role?: string } | null;
type AuthState = {
  token: string | null;
  user: CurrentUser;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: CurrentUser) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: async (token: string | null) => {
    try {
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('auth_token', token);
        }
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('auth_token');
        }
      }
    } catch {
      // Fallback for web or unsupported environments
      if (typeof window !== 'undefined') {
        if (token) window.localStorage?.setItem('auth_token', token);
        else window.localStorage?.removeItem('auth_token');
      }
    }
    set({ token });
  },
  setUser: (user: CurrentUser) => set({ user }),
}));


