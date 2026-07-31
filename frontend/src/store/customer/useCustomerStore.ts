import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';

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

export interface AddFarmerInput {
  customerCode: string;
  fullName: string;
  mobile: string;
  address?: string;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
}

export interface AddFarmerResult {
  success: boolean;
  error?: string;
  farmer?: Customer;
}

export interface CustomerState {
  // Data
  farmers: Customer[];

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchFarmers: () => Promise<void>;
  createFarmer: (farmer: AddFarmerInput) => Promise<AddFarmerResult>;
  addFarmer: (farmer: AddFarmerInput) => Promise<AddFarmerResult>; // Alias for backward compatibility
  reset: () => void;
}

const initialCustomerData = {
  farmers: [],
  status: 'idle' as StoreStatus,
  error: null,
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  ...initialCustomerData,

  // ── FETCH ALL CUSTOMERS ────────────────────────────────────────────────────
  fetchFarmers: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<Customer[]>('/customer/all-customers');
      set({ farmers: data ?? [], status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch customers:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── CREATE CUSTOMER ────────────────────────────────────────────────────────
  createFarmer: async (farmer) => {
    set({ status: 'loading', error: null });
    try {
      const { farmers } = get();

      const rawCode = farmer.customerCode.trim();
      const codeNum = parseInt(rawCode, 10);
      const nameStr = farmer.fullName.trim();

      const payload = {
        customerCode: rawCode,
        code: isNaN(codeNum) ? rawCode : codeNum,
        fullName: nameStr,
        name: nameStr,
        mobile: farmer.mobile.trim(),
        address: farmer.address?.trim() ?? '',
        milkType: farmer.milkType,
      };

      const res = await request<Customer>('/customer/create-new', 'POST', payload);

      set({ farmers: [res, ...farmers], status: 'success' });
      return { success: true, farmer: res };
    } catch (err: any) {
      const errMsg = err.message || 'Unable to register farmer';
      set({ error: errMsg, status: 'error' });
      return { success: false, error: errMsg };
    }
  },

  addFarmer: (farmer) => get().createFarmer(farmer),

  reset: () => set({ ...initialCustomerData }),
}));
