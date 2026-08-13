import { create } from 'zustand';
import type { User } from '../types';
import { apiGet, apiPost, setAccessToken } from '../api/client';

interface AuthState {
  user: User | null;
  isBootstrapping: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,
  setSession: (accessToken, user) => { setAccessToken(accessToken); set({ user, isBootstrapping: false }); },
  clearSession: () => { setAccessToken(null); set({ user: null, isBootstrapping: false }); },
  bootstrap: async () => {
    try {
      const response = await apiPost<{ accessToken: string; user: User }>('/auth/refresh');
      setAccessToken(response.accessToken);
      set({ user: response.user, isBootstrapping: false });
    } catch {
      setAccessToken(null);
      set({ user: null, isBootstrapping: false });
    }
  },
  logout: async () => {
    try { await apiPost('/auth/logout'); } finally { setAccessToken(null); set({ user: null, isBootstrapping: false }); }
  },
}));

export async function refreshUser() {
  const current = useAuthStore.getState();
  const user = await apiGet<User>('/auth/me');
  current.setSession('', user);
}
