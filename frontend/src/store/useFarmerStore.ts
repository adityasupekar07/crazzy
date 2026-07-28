import { create } from 'zustand';
import { request } from '../utils/api';

export interface Customer {
  id: string;
  code: number;
  name: string;
  mobile: string;
  address?: string;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  advanceBalance: number;
  isActive: boolean;
  createdAt: string;
  adminId: string;
}

interface FarmerState {
  farmers: Customer[];
  isLoading: boolean;
  error: string | null;

  fetchFarmers: () => Promise<void>;
  addFarmer: (farmer: { name: string; mobile: string; address?: string; milkType: 'COW' | 'BUFFALO' | 'MIX' }) => Promise<boolean>;
}

export const useFarmerStore = create<FarmerState>((set, get) => ({
  farmers: [],
  isLoading: false,
  error: null,

  // ── FETCH ALL CUSTOMERS ────────────────────────────────────────────────────
  fetchFarmers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<Customer[]>('/customer/all-customers');
      set({ farmers: data ?? [], isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch customers:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  // ── ADD CUSTOMER ───────────────────────────────────────────────────────────
  // Backend schema: { code (number), name, mobile (min 10), address?, milkType }
  addFarmer: async (farmer) => {
    set({ isLoading: true, error: null });
    try {
      const { farmers } = get();

      // Auto-increment customer code (backend requires it)
      const maxCode = farmers.reduce((max, f) => (f.code > max ? f.code : max), 100);
      const nextCode = maxCode + 1;

      const res = await request<Customer>('/customer/create-new', 'POST', {
        code: nextCode,
        name: farmer.name,
        mobile: farmer.mobile,
        address: farmer.address ?? '',
        milkType: farmer.milkType,
      });

      set({ farmers: [res, ...farmers], isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add farmer', isLoading: false });
      return false;
    }
  },
}));
