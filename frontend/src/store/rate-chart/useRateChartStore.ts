import { create } from 'zustand';
import { request } from '../../utils/api';
import { calculateRate as calcRateUtil } from '../../utils/calculations/rateCalculations';
import type { FatStep, SnfStep } from '../../utils/calculations/rateCalculations';
import type { StoreStatus } from '../utils/asyncHelper';

export type { FatStep, SnfStep };

export interface BonusPenaltyRule {
  id: string;
  axis: 'FAT' | 'SNF';
  fromValue: number;
  toValue: number;
  amount: number;
}

export type RateMethod = 'FAT_SNF' | 'FAT_ONLY' | 'FIXED';
export type ChartCategory = 'COLLECTION' | 'SALE';
export type ChartType = 'POINT' | 'EXCEL';

export interface RateChart {
  id: string;
  name: string;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  category: ChartCategory;
  chartType: ChartType;
  method: RateMethod;
  baseRate: number;
  isActive: boolean;
  effectiveFrom?: string;
  fatSteps: FatStep[];
  snfSteps: SnfStep[];
  rules: BonusPenaltyRule[];
  createdAt: string;
}

export interface CreateRateChartPayload {
  name: string;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  category: ChartCategory;
  chartType: ChartType;
  method: RateMethod;
  baseRate: number;
  fatSteps: { startValue: number; increment: number }[];
  snfSteps: { startValue: number; increment: number }[];
  rules?: { axis: 'FAT' | 'SNF'; fromValue: number; toValue: number; amount: number }[];
  effectiveFrom?: string;
}

export interface RateChartState {
  // Data
  rateCharts: RateChart[];

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchRateCharts: () => Promise<void>;
  createRateChart: (payload: CreateRateChartPayload) => Promise<boolean>;
  deleteRateChart: (id: string) => Promise<boolean>;
  calculateRate: (milkType: 'COW' | 'BUFFALO' | 'MIX', fat: number, snf: number) => { rate: number; chartName: string };
  reset: () => void;
}

const initialRateChartData = {
  rateCharts: [],
  status: 'idle' as StoreStatus,
  error: null,
};

export const useRateChartStore = create<RateChartState>((set, get) => ({
  ...initialRateChartData,

  // ── FETCH ──────────────────────────────────────────────────────────────────
  fetchRateCharts: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<any>('/rate-chart');
      const chartsList = Array.isArray(data) ? data : (data?.items ?? []);
      set({ rateCharts: chartsList, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch rate charts:', err.message);
      set({ rateCharts: [], status: 'error', error: err.message });
    }
  },

  // ── CREATE ─────────────────────────────────────────────────────────────────
  createRateChart: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      await request('/rate-chart/create', 'POST', payload);
      await get().fetchRateCharts();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create rate chart', status: 'error' });
      return false;
    }
  },

  // ── DELETE ─────────────────────────────────────────────────────────────────
  deleteRateChart: async (id) => {
    set({ status: 'loading', error: null });
    try {
      await request(`/rate-chart/${id}`, 'DELETE');
      set((s) => ({ rateCharts: s.rateCharts.filter((r) => r.id !== id), status: 'success' }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete rate chart', status: 'error' });
      return false;
    }
  },

  // ── CALCULATE RATE (Pure calculation delegate) ─────────────────────────────
  calculateRate: (milkType, fat, snf) => {
    return calcRateUtil(get().rateCharts, milkType, fat, snf);
  },

  reset: () => set({ ...initialRateChartData }),
}));
