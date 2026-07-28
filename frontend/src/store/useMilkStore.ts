import { create } from 'zustand';
import { request } from '../utils/api';
import { useRateChartStore } from './useRateChartStore';

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

interface MilkState {
  collections: MilkEntry[];
  isLoading: boolean;
  error: string | null;

  fetchCollections: () => Promise<void>;
  addCollectionEntry: (entry: {
    customerCode: number;
    milkType: 'COW' | 'BUFFALO' | 'MIX';
    quantity: number;
    fat: number;
    snf: number;
    shift: 'MORNING' | 'EVENING';
    // For display enrichment only (not sent to backend)
    customerName: string;
    customerId: string;
  }) => Promise<boolean>;
  deleteCollectionEntry: (id: string) => Promise<boolean>;
}

export const useMilkStore = create<MilkState>((set, get) => ({
  collections: [],
  isLoading: false,
  error: null,

  // ── FETCH TODAY'S ENTRIES ──────────────────────────────────────────────────
  fetchCollections: async () => {
    set({ isLoading: true, error: null });
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

      set({ collections: mapped, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch milk entries:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  // ── ADD ENTRY ──────────────────────────────────────────────────────────────
  // Backend schema: { customerCode (string), code (number), shift, milkType,
  //                   quantity, fat?, snf?, rate?, totalAmount?, date? }
  addCollectionEntry: async (entry) => {
    set({ isLoading: true, error: null });
    try {
      const calcStore = useRateChartStore.getState();
      const { rate } = calcStore.calculateRate(entry.milkType, entry.fat, entry.snf);
      const totalAmount = Number((entry.quantity * rate).toFixed(2));

      const res: any = await request('/milk/milk-entry', 'POST', {
        customerCode: String(entry.customerCode),   // string — backend schema
        code: Number(entry.customerCode),           // number — backend schema
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

      set({ collections: [newEntry, ...get().collections], isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to record milk entry', isLoading: false });
      return false;
    }
  },

  // ── DELETE ENTRY ───────────────────────────────────────────────────────────
  deleteCollectionEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await request(`/milk/${id}`, 'DELETE');
      set({ collections: get().collections.filter((c) => c.id !== id), isLoading: false });
      return true;
    } catch (err: any) {
      console.error('Delete entry failed:', err.message);
      set({ isLoading: false, error: err.message });
      return false;
    }
  },
}));
