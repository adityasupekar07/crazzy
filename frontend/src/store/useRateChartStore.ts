import { create } from 'zustand';
import { request } from '../utils/api';

// ── Backend-aligned types ────────────────────────────────────────────────────

export interface FatStep {
  id: string;
  startValue: number;
  increment: number;
}

export interface SnfStep {
  id: string;
  startValue: number;
  increment: number;
}

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

// ── Payload type for creating a rate chart ───────────────────────────────────

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

// ── Store ────────────────────────────────────────────────────────────────────

interface RateChartState {
  rateCharts: RateChart[];
  isLoading: boolean;
  error: string | null;

  fetchRateCharts: () => Promise<void>;
  createRateChart: (payload: CreateRateChartPayload) => Promise<boolean>;
  deleteRateChart: (id: string) => Promise<boolean>;
  /** Calculate rate from DB active chart; returns fallback if no chart configured */
  calculateRate: (milkType: 'COW' | 'BUFFALO' | 'MIX', fat: number, snf: number) => { rate: number; chartName: string };
}

export const useRateChartStore = create<RateChartState>((set, get) => ({
  rateCharts: [],
  isLoading: false,
  error: null,

  // ── FETCH ──────────────────────────────────────────────────────────────────
  fetchRateCharts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<RateChart[]>('/rate-chart/all');
      set({ rateCharts: data ?? [], isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch rate charts:', err.message);
      set({ rateCharts: [], isLoading: false, error: err.message });
    }
  },

  // ── CREATE ─────────────────────────────────────────────────────────────────
  createRateChart: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await request('/rate-chart/create', 'POST', payload);
      // Refresh from DB
      await get().fetchRateCharts();
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create rate chart', isLoading: false });
      return false;
    }
  },

  // ── DELETE ─────────────────────────────────────────────────────────────────
  deleteRateChart: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await request(`/rate-chart/${id}`, 'DELETE');
      set((s) => ({ rateCharts: s.rateCharts.filter((r) => r.id !== id), isLoading: false }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete rate chart', isLoading: false });
      return false;
    }
  },

  // ── CALCULATE RATE ─────────────────────────────────────────────────────────
  // Uses the active chart from the DB. For FIXED method: returns baseRate.
  // For FAT_ONLY: fat × increment from fatSteps.
  // For FAT_SNF: baseRate + fat-component + snf-component using steps.
  calculateRate: (milkType, fat, snf) => {
    const { rateCharts } = get();

    // Find active COLLECTION chart for this milk type
    const activeChart = rateCharts.find(
      (rc) => rc.isActive && rc.milkType === milkType && rc.category === 'COLLECTION'
    );

    if (!activeChart) {
      // No chart configured
      return { rate: 0, chartName: 'No rate chart configured' };
    }

    if (activeChart.method === 'FIXED') {
      return { rate: activeChart.baseRate, chartName: activeChart.name };
    }

    if (activeChart.method === 'FAT_ONLY') {
      // Compute per-unit value using fatSteps increment sum from startValue
      const totalFatRate = activeChart.fatSteps.reduce((acc, step) => {
        if (fat >= step.startValue) return acc + step.increment;
        return acc;
      }, activeChart.baseRate);
      return { rate: Number(totalFatRate.toFixed(2)), chartName: activeChart.name };
    }

    // FAT_SNF — add up fat + snf increments on top of base rate
    const fatAdd = activeChart.fatSteps.reduce((acc, step) => {
      if (fat >= step.startValue) return acc + step.increment;
      return acc;
    }, 0);

    const snfAdd = activeChart.snfSteps.reduce((acc, step) => {
      if (snf >= step.startValue) return acc + step.increment;
      return acc;
    }, 0);

    const totalRate = Number((activeChart.baseRate + fatAdd + snfAdd).toFixed(2));
    return { rate: totalRate, chartName: activeChart.name };
  },
}));
