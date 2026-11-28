import type {
  BillingFarmerItem,
  BillingPreviewResponse,
  FarmerHistoryResponse,
  FinalizeSettlementResponse,
  PaginatedSettlementList,
  ResolvedCycleRange,
  SettlementDetailResponse,
  SettlementListItem,
  SettlementListParams,
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
  finalizeError: string | null;
  finalizedSettlement: FinalizeSettlementResponse | null;
  error: string | null;

  // Phase 11: Settlement History & Detail
  settlementList: SettlementListItem[];
  settlementPagination: PaginatedSettlementList['pagination'] | null;
  settlementFilters: SettlementListParams;
  selectedSettlementId: string | null;
  settlementDetail: SettlementDetailResponse | null;
  isSettlementListLoading: boolean;
  isSettlementDetailLoading: boolean;
  settlementListError: string | null;
  settlementDetailError: string | null;

  setSelectedCycle: (cycle: BillingCycle | null) => void;
  setSelectedFarmer: (farmer: Farmer | null) => void;
  fetchFarmerHistory: () => Promise<void>;
  calculateBillPreview: () => Promise<void>;
  finalizeSettlement: () => Promise<FinalizeSettlementResponse | null>;
  clearPreview: () => void;
  clearFinalizedSettlement: () => void;

  setSettlementFilters: (filters: Partial<SettlementListParams>) => void;
  fetchSettlements: (overrideFilters?: SettlementListParams) => Promise<void>;
  selectSettlement: (settlementId: string | null) => void;
  fetchSettlementDetail: (settlementId: string) => Promise<void>;
  clearSelectedSettlement: () => void;

  reset: () => void;
}

