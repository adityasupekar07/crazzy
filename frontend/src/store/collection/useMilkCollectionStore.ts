import { create } from 'zustand';
import { request } from '../../utils/api';
import { calculateRate } from '../../utils/calculations/rateCalculations';
import { useRateChartStore } from '../rate-chart/useRateChartStore';
import type { StoreStatus } from '../utils/asyncHelper';

export interface MilkEntry {
  id: string;
  date: string;
  shift: 'MORNING' | 'EVENING';
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  totalAmount: number;
  customerId: string;
  customerName: string;
  customerCode: number;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  createdAt: string;
}

export interface CreateMilkEntryInput {
  customerCode: number;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  quantity: number;
  fat: number;
  snf: number;
  shift: 'MORNING' | 'EVENING';
  customerName: string;
  customerId: string;
}

export interface MilkCollectionState {
  // Data
  collections: MilkEntry[];

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchCollections: () => Promise<void>;
  createCollectionEntry: (entry: CreateMilkEntryInput) => Promise<boolean>;
  addCollectionEntry: (entry: CreateMilkEntryInput) => Promise<boolean>; // Alias
  deleteCollectionEntry: (id: string) => Promise<boolean>;
  reset: () => void;
}

const initialMilkData = {
  collections: [],
  status: 'idle' as StoreStatus,
  error: null,
};

export const useMilkCollectionStore = create<MilkCollectionState>((set, get) => ({
  ...initialMilkData,

  // ── FETCH TODAY'S ENTRIES ──────────────────────────────────────────────────
  fetchCollections: async () => {
    set({ status: 'loading', error: null });
    try {
      const data: any[] = await request('/milk/today');

      const mapped: MilkEntry[] = (data ?? []).map((item) => {
        let dateStr = new Date().toISOString().split('T')[0];
        if (item.date) {
          const d = new Date(item.date);
          dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
        return {
          id: item.id,
          date: dateStr,
          shift: item.shift,
          quantity: item.quantity,
          fat: item.fat ?? 0,
          snf: item.snf ?? 0,
          rate: item.rate ?? 0,
          totalAmount: item.totalAmount ?? 0,
          customerId: item.customerId,
          customerName: item.customer?.name ?? 'Unknown',
          customerCode: item.customer?.code ?? 0,
          milkType: item.milkType,
          createdAt: item.createdAt,
        };
      });

      set({ collections: mapped, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch milk entries:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── CREATE ENTRY ───────────────────────────────────────────────────────────
  createCollectionEntry: async (entry) => {
    set({ status: 'loading', error: null });
    try {
      const rateCharts = useRateChartStore.getState().rateCharts;
      const { rate } = calculateRate(rateCharts, entry.milkType, entry.fat, entry.snf);
      const totalAmount = Number((entry.quantity * rate).toFixed(2));

      const res: any = await request('/milk/milk-entry', 'POST', {
        customerCode: String(entry.customerCode),
        code: Number(entry.customerCode),
        shift: entry.shift,
        milkType: entry.milkType,
        quantity: Number(entry.quantity),
        fat: Number(entry.fat),
        snf: Number(entry.snf),
        rate,
        totalAmount,
      });

      let newDateStr = new Date().toISOString().split('T')[0];
      if (res.date) {
        const d = new Date(res.date);
        newDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      }

      const newEntry: MilkEntry = {
        id: res.id,
        date: newDateStr,
        shift: res.shift,
        quantity: res.quantity,
        fat: res.fat ?? entry.fat,
        snf: res.snf ?? entry.snf,
        rate: res.rate ?? rate,
        totalAmount: res.totalAmount ?? totalAmount,
        customerId: res.customerId,
        customerName: entry.customerName,
        customerCode: entry.customerCode,
        milkType: res.milkType,
        createdAt: res.createdAt,
      };

      set({ collections: [newEntry, ...get().collections], status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to record milk entry', status: 'error' });
      return false;
    }
  },

  addCollectionEntry: (entry) => get().createCollectionEntry(entry),

  // ── DELETE ENTRY ───────────────────────────────────────────────────────────
  deleteCollectionEntry: async (id) => {
    set({ status: 'loading', error: null });
    try {
      await request(`/milk/${id}`, 'DELETE');
      set({ collections: get().collections.filter((c) => c.id !== id), status: 'success' });
      return true;
    } catch (err: any) {
      console.error('Delete entry failed:', err.message);
      set({ status: 'error', error: err.message });
      return false;
    }
  },

  reset: () => set({ ...initialMilkData }),
}));
