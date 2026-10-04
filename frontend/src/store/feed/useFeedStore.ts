import { create } from 'zustand';
import { request } from '../../utils/api';
import type { StoreStatus } from '../utils/asyncHelper';

export interface FoodDealer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface FoodPurchase {
  id: string;
  dealerId: string;
  dealer?: { name: string };
  foodName: string;
  quantity: number;
  remainingQuantity: number;
  buyRate: number;
  sellRate: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  purchaseDate: string;
  createdAt: string;
}

export interface FoodSale {
  id: string;
  customerId: string;
  customer?: { name: string; code: number };
  foodPurchaseId: string;
  foodPurchase?: { foodName: string; sellRate: number };
  quantity: number;
  sellRate: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  isCashPayment: boolean;
  saleDate: string;
  createdAt: string;
}

export interface CreateDealerInput {
  name: string;
  phone: string;
  address?: string;
  code: string;
}

export interface UpdateDealerInput {
  name?: string;
  phone?: string;
  address?: string;
  code?: string;
}

export interface CreatePurchaseInput {
  dealerId: string;
  foodName: string;
  quantity: number;
  buyRate: number;
  sellRate: number;
  amountPaid: number;
  purchaseDate: string;
}

export interface CreateSaleInput {
  customerId: string;
  foodPurchaseId: string;
  quantity: number;
  amountPaid: number;
  isCashPayment: boolean;
  saleDate: string;
}

export interface FeedState {
  // Data
  dealers: FoodDealer[];
  purchases: FoodPurchase[];
  sales: FoodSale[];

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  fetchDealers: () => Promise<void>;
  fetchPurchases: () => Promise<void>;
  fetchSales: () => Promise<void>;
  createDealer: (dealer: CreateDealerInput) => Promise<boolean>;
  addDealer: (dealer: CreateDealerInput) => Promise<boolean>; // Alias
  updateDealer: (id: string, dealer: Partial<UpdateDealerInput>) => Promise<boolean>;
  toggleDealerStatus: (id: string) => Promise<boolean>;
  createPurchase: (purchase: CreatePurchaseInput) => Promise<boolean>;
  recordPurchase: (purchase: CreatePurchaseInput) => Promise<boolean>; // Alias
  createSale: (sale: CreateSaleInput) => Promise<boolean>;
  recordSale: (sale: CreateSaleInput) => Promise<boolean>; // Alias
  reset: () => void;
}

const initialFeedData = {
  dealers: [],
  purchases: [],
  sales: [],
  status: 'idle' as StoreStatus,
  error: null,
};

export const useFeedStore = create<FeedState>((set, get) => ({
  ...initialFeedData,

  // ── FETCH DEALERS ──────────────────────────────────────────────────────────
  fetchDealers: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<FoodDealer[]>('/food-dealers/get-all-dealers');
      set({ dealers: data ?? [], status: 'success' });
    } catch (err: any) {
      console.error('Dealers fetch failed:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── FETCH PURCHASES ────────────────────────────────────────────────────────
  fetchPurchases: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<FoodPurchase[]>('/food-purchases/all-purchases');
      set({ purchases: data ?? [], status: 'success' });
    } catch (err: any) {
      console.error('Purchases fetch failed:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── FETCH SALES ────────────────────────────────────────────────────────────
  fetchSales: async () => {
    set({ status: 'loading', error: null });
    try {
      const data = await request<FoodSale[]>('/food-sales/get-all-sales');
      set({ sales: data ?? [], status: 'success' });
    } catch (err: any) {
      console.error('Sales fetch failed:', err.message);
      set({ status: 'error', error: err.message });
    }
  },

  // ── CREATE DEALER ──────────────────────────────────────────────────────────
  createDealer: async (dealer) => {
    set({ status: 'loading', error: null });
    try {
      await request('/food-dealers/create-new-dealer', 'POST', {
        code: dealer.code,
        name: dealer.name,
        phone: dealer.phone,
        address: dealer.address ?? '',
        isActive: true,
      });
      await get().fetchDealers();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message, status: 'error' });
      return false;
    }
  },
  addDealer: (dealer) => get().createDealer(dealer),

  // ── UPDATE DEALER ──────────────────────────────────────────────────────────
  updateDealer: async (id, dealer) => {
    set({ status: 'loading', error: null });
    try {
      await request(`/food-dealers/${id}`, 'PATCH', dealer);
      await get().fetchDealers();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message, status: 'error' });
      return false;
    }
  },

  // ── TOGGLE DEALER STATUS ───────────────────────────────────────────────────
  toggleDealerStatus: async (id) => {
    set({ status: 'loading', error: null });
    try {
      await request(`/food-dealers/${id}`, 'DELETE');
      await get().fetchDealers();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message, status: 'error' });
      return false;
    }
  },

  // ── CREATE PURCHASE ────────────────────────────────────────────────────────
  createPurchase: async (purchase) => {
    set({ status: 'loading', error: null });
    try {
      await request('/food-purchases/create', 'POST', {
        dealerId: purchase.dealerId,
        foodName: purchase.foodName,
        quantity: Number(purchase.quantity),
        buyRate: Number(purchase.buyRate),
        sellRate: Number(purchase.sellRate),
        amountPaid: Number(purchase.amountPaid),
        purchaseDate: purchase.purchaseDate,
      });
      await get().fetchPurchases();
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message, status: 'error' });
      return false;
    }
  },
  recordPurchase: (purchase) => get().createPurchase(purchase),

  // ── CREATE SALE ────────────────────────────────────────────────────────────
  createSale: async (sale) => {
    set({ status: 'loading', error: null });
    try {
      await request('/food-sales/create', 'POST', {
        customerId: sale.customerId,
        foodPurchaseId: sale.foodPurchaseId,
        quantity: Number(sale.quantity),
        amountPaid: Number(sale.amountPaid),
        isCashPayment: sale.isCashPayment,
        saleDate: sale.saleDate,
      });
      await Promise.all([get().fetchSales(), get().fetchPurchases()]);
      set({ status: 'success' });
      return true;
    } catch (err: any) {
      set({ error: err.message, status: 'error' });
      return false;
    }
  },
  recordSale: (sale) => get().createSale(sale),

  reset: () => set({ ...initialFeedData }),
}));
