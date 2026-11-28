import type {
  BillingFarmerItem,
  BillingPreviewResponse,
  FarmerHistoryResponse,
  ResolvedCycleRange,
} from '../../modules/billing/billing.types';

export type BillingCycle = ResolvedCycleRange;
export type Farmer = BillingFarmerItem;
export type FarmerHistory = FarmerHistoryResponse;
export type BillPreview = BillingPreviewResponse;

export interface BillingSettlementState {
  selectedCycle: BillingCycle | null;
  selectedFarmer: Farmer | null;

  farmerHistory: FarmerHistory | null;
  billPreview: BillPreview | null;

  isHistoryLoading: boolean;
  isPreviewLoading: boolean;
  isFinalizing: boolean;

  historyError: string | null;
  previewError: string | null;
  error: string | null;

  setSelectedCycle: (cycle: BillingCycle | null) => void;
  setSelectedFarmer: (farmer: Farmer | null) => void;
  fetchFarmerHistory: () => Promise<void>;
  calculateBillPreview: () => Promise<void>;
  clearPreview: () => void;
  reset: () => void;
}

