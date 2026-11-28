import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';
import { queryClient } from '../../lib/queryClient';
import { QUERY_KEYS } from '../../queries/keys';
import type { BillingFarmerItem } from '../../modules/billing/billing.types';

export interface SettlementRecord {
  id: string;
  adminId: string;
  customerId: string;
  customerName: string;
  customerCode: number;
  startDate: string;
  endDate: string;
  period: string;
  litres: number;
  avgFat: number;
  avgSnf: number;
  grossAmount: number;
  advanceDeductionAmount: number;
  netPayable: number;
  milkEntryCount: number;
  milkEntryIds: string[];
  remarks?: string;
  createdAt: string;
}

export interface CreateSettlementInput {
  customerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  netPayable: number;
  advanceDeductionAmount?: number;
  litres?: number;
  avgFat?: number;
  avgSnf?: number;
  milkEntryIds?: string[];
  remarks?: string;
}

export interface BillingState {
  // Data
  settlements: SettlementRecord[];
  selectedFarmer: BillingFarmerItem | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  setSelectedFarmer: (farmer: BillingFarmerItem | null) => void;
  fetchSettlements: (customerId?: string) => Promise<void>;
  createSettlement: (payload: CreateSettlementInput) => Promise<boolean>;
  reset: () => void;
}

const initialBillingData = {
  settlements: [],
  selectedFarmer: null as BillingFarmerItem | null,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useBillingStore = create<BillingState>((set, get) => ({
  ...initialBillingData,

  setSelectedFarmer: (farmer) => set({ selectedFarmer: farmer }),

  // ── FETCH SETTLEMENT HISTORY ───────────────────────────────────────────────
  fetchSettlements: async (customerId?: string) => {
    set({ status: 'loading', error: null });
    try {
      const qs = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
      const data = await request<SettlementRecord[]>(`/billing/history${qs}`);
      set({ settlements: data ?? [], status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch settlements:', err.message);
      set({ status: 'error', error: err.message || 'Failed to fetch settlements' });
    }
  },

  // ── CREATE SETTLEMENT ──────────────────────────────────────────────────────
  createSettlement: async (payload: CreateSettlementInput) => {
    set({ status: 'loading', error: null });
    try {
      const record = await request<SettlementRecord>('/billing/settle', 'POST', payload);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.advances.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farmers.all });
      set({
        settlements: [record, ...get().settlements],
        status: 'success',
      });
      return true;
    } catch (err: any) {
      console.error('Failed to settle bill:', err.message);
      set({ status: 'error', error: err.message || 'Failed to settle bill' });
      return false;
    }
  },

  reset: () => set({ ...initialBillingData }),
}));
