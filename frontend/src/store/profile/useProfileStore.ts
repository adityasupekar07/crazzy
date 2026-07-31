import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';

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

export interface ProfileState {
  // Data
  profile: AdminProfile | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  reset: () => void;
}

const initialProfileData = {
  profile: null,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useProfileStore = create<ProfileState>((set) => ({
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

  reset: () => set({ ...initialProfileData }),
}));
