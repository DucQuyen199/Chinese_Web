import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

const initialTheme = (localStorage.getItem('hanlearn-theme') as Theme | null) ?? 'light';

export const useUiStore = create<UiState>((set) => ({
  theme: initialTheme,
  sidebarCollapsed: false,
  setTheme: (theme) => { localStorage.setItem('hanlearn-theme', theme); set({ theme }); },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
