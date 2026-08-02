import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';

export interface DashboardStats {
  totalCustomers: number;
  todayMilkCollection: number;
  todayAmount: number;
}

export interface DashboardState {
  // Data
  dashboardStats: DashboardStats | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  reset: () => void;
}

const initialDashboardData = {
  dashboardStats: null,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialDashboardData,

  fetchDashboard: async (force = false) => {
    if (!force && get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      const data = await request<DashboardStats>('/admin/dashboard');
      set({ dashboardStats: data, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  reset: () => set({ ...initialDashboardData }),
}));
