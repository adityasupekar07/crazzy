import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';

export type AdvanceStatus = 'ACTIVE' | 'PARTIALLY_RECOVERED' | 'CLOSED';
export type TransactionType = 'ISSUED' | 'MANUAL_REPAYMENT' | 'AUTO_DEDUCTED_BILL';

export interface AdvanceTransaction {
  id: string;
  advanceId: string;
  type: TransactionType;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  adminId: string;
  customerId: string;
  advanceNumber: string;
  originalAmount: number;
  recoveredAmount: number;
  pendingAmount: number;
  status: AdvanceStatus;
  notes?: string;
  givenDate: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
  };
  transactions?: AdvanceTransaction[];
}

export interface CustomerAdvanceSummary {
  customer: {
    id: string;
    name: string;
    mobile: string;
  };
  summary: {
    totalAdvance: number;
    totalRecovered: number;
    totalPending: number;
  };
  advances: Advance[];
}

export interface FetchAdvancesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdvanceStatus;
}

export interface AdvancePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdvanceState {
  // Data
  advances: Advance[];
  pagination: AdvancePagination | null;
  customerSummary: CustomerAdvanceSummary | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchAdvances: (params?: FetchAdvancesParams) => Promise<void>;
  createAdvance: (data: {
    customerId: string;
    amount: number;
    givenDate: string;
    notes?: string;
  }) => Promise<boolean>;
  createRepayment: (
    advanceId: string,
    data: { amount: number; notes?: string }
  ) => Promise<boolean>;
  addRepayment: (
    advanceId: string,
    data: { amount: number; notes?: string }
  ) => Promise<boolean>; // Alias
  fetchCustomerAdvances: (customerId: string) => Promise<void>;
  getAdvanceById: (advanceId: string) => Promise<Advance | null>;
  clearError: () => void;
  reset: () => void;
}

const initialAdvanceData = {
  advances: [],
  pagination: null,
  customerSummary: null,
  status: 'idle' as StoreStatus,
  error: null,
};

export const useAdvanceStore = create<AdvanceState>((set, get) => ({
  ...initialAdvanceData,

  clearError: () => set({ error: null }),

  // ── GET ALL ADVANCES ───────────────────────────────────────────────────────
  fetchAdvances: async (params = {}) => {
    set({ status: 'loading', error: null });
    try {
      const queryParts: string[] = [];
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.status) queryParts.push(`status=${params.status}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
      const data = await request<{
        advances: Advance[];
        pagination: AdvancePagination;
      }>(`/advance${queryString}`);

      const normalizedAdvances = (data.advances ?? []).map((a) => ({
        ...a,
        originalAmount: Number(a.originalAmount) || 0,
        recoveredAmount: Number(a.recoveredAmount) || 0,
        pendingAmount: Number(a.pendingAmount) || 0,
        transactions: a.transactions?.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
        })),
      }));

      set({
        advances: normalizedAdvances,
        pagination: data.pagination ?? null,
        status: 'success',
      });
    } catch (err: any) {
      console.error('Failed to fetch advances:', err.message);
      set({ status: 'error', error: err.message || 'Failed to fetch advances' });
    }
  },

  // ── CREATE ADVANCE ─────────────────────────────────────────────────────────
  createAdvance: async (data) => {
    set({ status: 'loading', error: null });
    try {
      await request<Advance>('/advance', 'POST', data);
      await get().fetchAdvances();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      console.error('Failed to create advance:', err.message);
      set({ status: 'error', error: err.message || 'Failed to create advance' });
      return false;
    }
  },

  // ── CREATE REPAYMENT ───────────────────────────────────────────────────────
  createRepayment: async (advanceId, data) => {
    set({ status: 'loading', error: null });
    try {
      await request<Advance>(`/advance/${advanceId}/repayments`, 'POST', data);
      await get().fetchAdvances();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      console.error('Failed to add repayment:', err.message);
      set({ status: 'error', error: err.message || 'Failed to record repayment' });
      return false;
    }
  },
  addRepayment: (advanceId, data) => get().createRepayment(advanceId, data),

  // ── GET CUSTOMER ADVANCES ──────────────────────────────────────────────────
  fetchCustomerAdvances: async (customerId) => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<CustomerAdvanceSummary>(`/advance/customer/${customerId}`);
      set({ customerSummary: data, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch customer advances:', err.message);
      set({ status: 'error', error: err.message || 'Failed to fetch customer advance history' });
    }
  },

  // ── GET ADVANCE BY ID ──────────────────────────────────────────────────────
  getAdvanceById: async (advanceId) => {
    try {
      const adv = await request<Advance>(`/advance/${advanceId}`);
      if (!adv) return null;
      return {
        ...adv,
        originalAmount: Number(adv.originalAmount) || 0,
        recoveredAmount: Number(adv.recoveredAmount) || 0,
        pendingAmount: Number(adv.pendingAmount) || 0,
        transactions: adv.transactions?.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
        })),
      };
    } catch (err: any) {
      console.error('Failed to fetch advance by id:', err.message);
      return null;
    }
  },

  reset: () => set({ ...initialAdvanceData }),
}));
