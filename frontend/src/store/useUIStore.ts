import { create } from 'zustand';

type ViewType = 'landing' | 'dashboard';
type TabType = 'milk' | 'farmers' | 'rates' | 'feed' | 'billing';
type AuthMode = 'login' | 'register';

interface UIState {
  currentView: ViewType;
  activeTab: TabType;
  authModalOpen: boolean;
  authModalMode: AuthMode;
  setView: (view: ViewType) => void;
  setActiveTab: (tab: TabType) => void;
  setAuthModal: (open: boolean, mode?: AuthMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'landing',
  activeTab: 'milk',
  authModalOpen: false,
  authModalMode: 'login',
  setView: (view) => set({ currentView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAuthModal: (open, mode = 'login') =>
    set({ authModalOpen: open, authModalMode: mode }),
}));
