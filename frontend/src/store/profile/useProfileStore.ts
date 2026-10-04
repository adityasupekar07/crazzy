import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';
import { useAuthStore } from '../auth/useAuthStore';

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
  gstin?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileState {
  // Data
  profile: AdminProfile | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<AdminProfile>) => Promise<boolean>;
  reset: () => void;
}

const initialProfileData = {
  profile: null,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...initialProfileData,

  fetchProfile: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<AdminProfile>('/admin/profile');
      set({ profile: data, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch admin profile:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  updateProfile: async (payload: Partial<AdminProfile>) => {
    set({ status: 'loading', error: null });
    try {
      const updated = await request<AdminProfile>('/admin/profile', 'PATCH', payload);
      set({ profile: { ...(get().profile || {}), ...updated }, status: 'success' });

      // Synchronize with auth store user and localStorage
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        const mergedUser = { ...authUser, ...updated };
        useAuthStore.setState({ user: mergedUser as any });
        localStorage.setItem('user', JSON.stringify(mergedUser));
      }

      return true;
    } catch (err: any) {
      console.error('Failed to update admin profile:', err.message);
      set({ status: 'error', error: err.message || 'Failed to update profile' });
      return false;
    }
  },

  reset: () => set({ ...initialProfileData }),
}));
