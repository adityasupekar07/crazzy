import { create } from 'zustand';
import { request } from '../utils/api';

// ── Types (aligned to backend response shapes) ────────────────────────────────

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

// ── Store ─────────────────────────────────────────────────────────────────────

interface FeedState {
  dealers: FoodDealer[];
  purchases: FoodPurchase[];
  sales: FoodSale[];
  isLoading: boolean;
  error: string | null;

  fetchDealers: () => Promise<void>;
  fetchPurchases: () => Promise<void>;
  fetchSales: () => Promise<void>;
  addDealer: (dealer: { name: string; phone: string; address?: string; code: string }) => Promise<boolean>;
  recordPurchase: (purchase: {
    dealerId: string;
    foodName: string;
    quantity: number;
    buyRate: number;
    sellRate: number;
    amountPaid: number;
    purchaseDate: string;
  }) => Promise<boolean>;
  recordSale: (sale: {
    customerId: string;
    foodPurchaseId: string;
    quantity: number;
    amountPaid: number;
    isCashPayment: boolean;
    saleDate: string;
  }) => Promise<boolean>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  dealers: [],
  purchases: [],
  sales: [],
  isLoading: false,
  error: null,

  // ── FETCH DEALERS ──────────────────────────────────────────────────────────
  fetchDealers: async () => {
    try {
      const data = await request<FoodDealer[]>('/food-dealers/get-all-dealers');
      set({ dealers: data ?? [] });
    } catch (err: any) {
      console.warn('Dealers fetch failed:', err.message);
    }
  },

  // ── FETCH PURCHASES ────────────────────────────────────────────────────────
  fetchPurchases: async () => {
    try {
      const data = await request<FoodPurchase[]>('/food-purchases/all-purchases');
      set({ purchases: data ?? [] });
    } catch (err: any) {
      console.warn('Purchases fetch failed:', err.message);
    }
  },

  // ── FETCH SALES ────────────────────────────────────────────────────────────
  fetchSales: async () => {
    try {
      const data = await request<FoodSale[]>('/food-sales/get-all-sales');
      set({ sales: data ?? [] });
    } catch (err: any) {
      console.warn('Sales fetch failed:', err.message);
    }
  },

  // ── ADD DEALER ─────────────────────────────────────────────────────────────
  addDealer: async (dealer) => {
    set({ isLoading: true, error: null });
    try {
      await request('/food-dealers/create-new-dealer', 'POST', {
        code: dealer.code,
        name: dealer.name,
        phone: dealer.phone,
        address: dealer.address ?? '',
        isActive: true,
      });
      await get().fetchDealers();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // ── RECORD PURCHASE ────────────────────────────────────────────────────────
  recordPurchase: async (purchase) => {
    set({ isLoading: true, error: null });
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
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // ── RECORD SALE ────────────────────────────────────────────────────────────
  recordSale: async (sale) => {
    set({ isLoading: true, error: null });
    try {
      await request('/food-sales/create', 'POST', {
        customerId: sale.customerId,
        foodPurchaseId: sale.foodPurchaseId,
        quantity: Number(sale.quantity),
        amountPaid: Number(sale.amountPaid),
        isCashPayment: sale.isCashPayment,
        saleDate: sale.saleDate,
      });
      // Refresh both sales and purchases (remaining qty changes)
      await Promise.all([get().fetchSales(), get().fetchPurchases()]);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));
