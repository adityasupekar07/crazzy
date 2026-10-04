import { create } from 'zustand';
import { request } from '../../utils/api';
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
  rate?: number;
  totalAmount?: number;
  rateChartId?: string;
}

export interface MilkCollectionState {
  // Data
  collections: MilkEntry[];
  history: MilkEntry[];

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchCollections: () => Promise<void>;
  fetchHistory: (startDate?: string, endDate?: string, customerId?: string) => Promise<void>;
  createCollectionEntry: (entry: CreateMilkEntryInput) => Promise<boolean>;
  addCollectionEntry: (entry: CreateMilkEntryInput) => Promise<boolean>; // Alias
  updateCollectionEntry: (id: string, entry: Partial<CreateMilkEntryInput>) => Promise<boolean>;
  deleteCollectionEntry: (id: string) => Promise<boolean>;
  reset: () => void;
}

function mapRawMilkEntry(item: any): MilkEntry {
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
}

const initialMilkData = {
  collections: [],
  history: [],
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
      const mapped: MilkEntry[] = (data ?? []).map(mapRawMilkEntry);
      set({ collections: mapped, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch milk entries:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── FETCH HISTORICAL ENTRIES ───────────────────────────────────────────────
  fetchHistory: async (startDate?: string, endDate?: string, customerId?: string) => {
    set({ status: 'loading', error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (customerId) params.set('customerId', customerId);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data: any[] = await request(`/milk/history${qs}`);
      const mapped: MilkEntry[] = (data ?? []).map(mapRawMilkEntry);
      set({ history: mapped, status: 'success' });
    } catch (err: any) {
      console.error('Failed to fetch milk history:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── CREATE ENTRY ───────────────────────────────────────────────────────────
  createCollectionEntry: async (entry) => {
    set({ status: 'loading', error: null });
    try {
      const res: any = await request('/milk/milk-entry', 'POST', {
        customerCode: String(entry.customerCode),
        code: Number(entry.customerCode),
        shift: entry.shift,
        milkType: entry.milkType,
        quantity: Number(entry.quantity),
        fat: Number(entry.fat),
        snf: Number(entry.snf),
        rate: entry.rate,
        totalAmount: entry.totalAmount,
        rateChartId: entry.rateChartId,
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
        rate: res.rate ?? entry.rate ?? 0,
        totalAmount: res.totalAmount ?? entry.totalAmount ?? 0,
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

  // ── UPDATE ENTRY ───────────────────────────────────────────────────────────
  updateCollectionEntry: async (id, entry) => {
    set({ status: 'loading', error: null });
    try {
      const payload: any = {};
      if (entry.customerCode) payload.customerCode = String(entry.customerCode);
      if (entry.shift) payload.shift = entry.shift;
      if (entry.milkType) payload.milkType = entry.milkType;
      if (entry.quantity) payload.quantity = Number(entry.quantity);
      if (entry.fat !== undefined) payload.fat = Number(entry.fat);
      if (entry.snf !== undefined) payload.snf = Number(entry.snf);
      if (entry.rate !== undefined) payload.rate = entry.rate;
      if (entry.totalAmount !== undefined) payload.totalAmount = entry.totalAmount;
      if (entry.rateChartId) payload.rateChartId = entry.rateChartId;

      const res: any = await request(`/milk/${id}`, 'PATCH', payload);
      const updatedEntry = mapRawMilkEntry(res);

      set({ 
        collections: get().collections.map(c => c.id === id ? updatedEntry : c),
        history: get().history.map(c => c.id === id ? updatedEntry : c),
        status: 'success' 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update milk entry', status: 'error' });
      return false;
    }
  },

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
