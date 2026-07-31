import { create } from 'zustand';
import type { StoreStatus } from '../utils/asyncHelper';

type ViewType = 'landing' | 'dashboard';
type TabType = 'milk' | 'farmers' | 'rates' | 'feed' | 'billing';
type AuthMode = 'login' | 'register';

export interface UIState {
  // Data
  currentView: ViewType;
  activeTab: TabType;
  authModalOpen: boolean;
  authModalMode: AuthMode;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  setView: (view: ViewType) => void;
  setActiveTab: (tab: TabType) => void;
  setAuthModal: (open: boolean, mode?: AuthMode) => void;
  reset: () => void;
}

const initialUIData = {
  currentView: 'landing' as ViewType,
  activeTab: 'milk' as TabType,
  authModalOpen: false,
  authModalMode: 'login' as AuthMode,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialUIData,

  setView: (view) => set({ currentView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAuthModal: (open, mode = 'login') =>
    set({ authModalOpen: open, authModalMode: mode }),

  reset: () => set({ ...initialUIData }),
}));
