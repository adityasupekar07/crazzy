import { create } from 'zustand';
import { request } from '../utils/api';

export interface AdminProfile {
  id: string;
  ownerName: string;
  mobile: string;
  dairyName: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  collectionType: 'FIXED_RATE' | 'FAT_BASED' | 'FAT_SNF_BASED';
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  collectionShift: 'MORNING' | 'EVENING' | 'BOTH';
  paymentPeriod: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  todayMilkCollection: number;
  todayAmount: number;
}

interface AdminState {
  profile: AdminProfile | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  profile: null,
  dashboardStats: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminProfile>('/admin/profile');
      set({ profile: data, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch admin profile:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await request<DashboardStats>('/admin/dashboard');
      set({ dashboardStats: data });
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err.message);
    }
  },
}));
