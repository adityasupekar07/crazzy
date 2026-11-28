import { create } from 'zustand';
import { billingApi } from '../../modules/billing/billing.api';
import type { BillingSettlementState } from './billing.types';

const initialState = {
  selectedCycle: null,
  selectedFarmer: null,
  farmerHistory: null,
  billPreview: null,
  isHistoryLoading: false,
  isPreviewLoading: false,
  isFinalizing: false,
  historyError: null,
  previewError: null,
  error: null,
  settlementList: [],
  settlementPagination: null,
  settlementFilters: { page: 1, limit: 20 },
  selectedSettlementId: null,
  settlementDetail: null,
  isSettlementListLoading: false,
  isSettlementDetailLoading: false,
  settlementListError: null,
  settlementDetailError: null,
};

export const useBillingSettlementStore = create<BillingSettlementState>((set, get) => ({
  ...initialState,

  setSelectedCycle: (cycle) => {
    const prev = get().selectedCycle;
    const isSame =
      prev?.type === cycle?.type &&
      prev?.startDate === cycle?.startDate &&
      prev?.endDate === cycle?.endDate;

    if (isSame) return;

    set({
      selectedCycle: cycle,
      farmerHistory: null,
      billPreview: null,
      historyError: null,
      previewError: null,
      error: null,
    });
  },

  setSelectedFarmer: (farmer) => {
    const prev = get().selectedFarmer;
    if (prev?.id === farmer?.id) return;

    set({
      selectedFarmer: farmer,
      farmerHistory: null,
      billPreview: null,
      historyError: null,
      previewError: null,
      error: null,
    });
  },

  fetchFarmerHistory: async () => {
    const { selectedFarmer, selectedCycle, isHistoryLoading } = get();
    if (!selectedFarmer || !selectedCycle || isHistoryLoading) return;

    set({
      isHistoryLoading: true,
      historyError: null,
      previewError: null,
      error: null,
      billPreview: null,
    });

    try {
      const history = await billingApi.getFarmerHistory(
        selectedFarmer.id,
        selectedCycle.startDate,
        selectedCycle.endDate
      );
      set({
        farmerHistory: history,
        isHistoryLoading: false,
        historyError: null,
        error: null,
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to load farmer history';
      set({
        isHistoryLoading: false,
        historyError: message,
        error: message,
      });
    }
  },

  calculateBillPreview: async () => {
    const { selectedFarmer, selectedCycle, farmerHistory, isHistoryLoading, isPreviewLoading } =
      get();
    if (!selectedFarmer || !selectedCycle || isHistoryLoading || isPreviewLoading) return;

    const historyMatchesSelection =
      farmerHistory &&
      farmerHistory.farmer.id === selectedFarmer.id &&
      farmerHistory.period.startDate === selectedCycle.startDate &&
      farmerHistory.period.endDate === selectedCycle.endDate;

    if (!historyMatchesSelection) return;

    set({
      isPreviewLoading: true,
      previewError: null,
      error: null,
    });

    try {
      const preview = await billingApi.generatePreview({
        farmerId: selectedFarmer.id,
        cycleType: selectedCycle.type,
        startDate: selectedCycle.startDate,
        endDate: selectedCycle.endDate,
      });
      set({
        billPreview: preview,
        isPreviewLoading: false,
        previewError: null,
        error: null,
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to calculate bill preview';
      set({
        isPreviewLoading: false,
        previewError: message,
        error: message,
      });
    }
  },

  clearPreview: () => set({ billPreview: null, previewError: null }),

  setSettlementFilters: (filters) => {
    const next = { ...get().settlementFilters, ...filters };
    set({ settlementFilters: next });
  },

  fetchSettlements: async (overrideFilters) => {
    const params = overrideFilters ?? get().settlementFilters;
    set({
      isSettlementListLoading: true,
      settlementListError: null,
      settlementFilters: params,
    });
    try {
      const res = await billingApi.getSettlements(params);
      set({
        settlementList: res.data,
        settlementPagination: res.pagination,
        isSettlementListLoading: false,
        settlementListError: null,
      });
    } catch (err: any) {
      set({
        isSettlementListLoading: false,
        settlementListError: err?.message || 'Failed to load settlements',
      });
    }
  },

  selectSettlement: (settlementId) => {
    set({
      selectedSettlementId: settlementId,
      settlementDetail: null,
      settlementDetailError: null,
    });
  },

  fetchSettlementDetail: async (settlementId) => {
    set({
      selectedSettlementId: settlementId,
      isSettlementDetailLoading: true,
      settlementDetailError: null,
    });
    try {
      const detail = await billingApi.getSettlementDetails(settlementId);
      set({
        settlementDetail: detail,
        isSettlementDetailLoading: false,
        settlementDetailError: null,
      });
    } catch (err: any) {
      set({
        isSettlementDetailLoading: false,
        settlementDetailError: err?.message || 'Failed to load settlement details',
      });
    }
  },

  clearSelectedSettlement: () =>
    set({
      selectedSettlementId: null,
      settlementDetail: null,
      settlementDetailError: null,
    }),

  reset: () => set({ ...initialState }),
}));

