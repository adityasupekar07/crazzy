export type PaymentCycleType = 'TEN_DAY' | 'FIFTEEN_DAY' | 'MONTHLY' | 'CUSTOM';

export interface PaymentCycleOption {
  type: PaymentCycleType;
  label: string;
}

export interface ResolvedCycleRange {
  type: PaymentCycleType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface BillingFarmerItem {
  id: string;
  code: number;
  name: string;
  mobile: string;
  isActive: boolean;
  outstandingFeedAmount: string;
  outstandingAdvanceAmount: string;
}

export interface PaginatedBillingFarmers {
  farmers: BillingFarmerItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FarmerHistoryMilkItem {
  id: string;
  date: string;
  shift: string;
  milkType: string;
  litres: string;
  fat: string;
  snf: string;
  rate: string;
  amount: string;
  isSettled: boolean;
  settlementNumber?: string | null;
}

export interface FarmerHistoryFeedItem {
  id: string;
  foodName: string;
  saleDate: string;
  quantity: string;
  originalAmount: string;
  amountPaidUpfront: string;
  settlementDeductedAmount: string;
  remainingOutstanding: string;
  category: 'PREVIOUS_OUTSTANDING' | 'CURRENT_PERIOD';
}

export interface FarmerHistoryAdvanceItem {
  id: string;
  advanceId: string;
  advanceNumber: string;
  date: string;
  type: 'ISSUED' | 'MANUAL_REPAYMENT' | 'BILL_SETTLEMENT_RECOVERY';
  amount: string;
  remainingBalance: string;
  settlementNumber?: string | null;
  notes?: string | null;
}

export interface FarmerHistoryResponse {
  farmer: {
    id: string;
    code: number;
    name: string;
    mobile: string;
    isActive: boolean;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  milkCollections: FarmerHistoryMilkItem[];
  milkSummary: {
    totalLitres: string;
    totalAmount: string;
    eligibleCount: number;
    settledCount: number;
  };
  feedSales: FarmerHistoryFeedItem[];
  feedSummary: {
    previousOutstanding: string;
    currentSales: string;
    totalOutstanding: string;
  };
  advanceHistory: FarmerHistoryAdvanceItem[];
  advanceSummary: {
    totalGiven: string;
    totalRepaid: string;
    remainingOutstanding: string;
  };
}

export interface BillingPreviewRequest {
  farmerId: string;
  cycleType: PaymentCycleType;
  startDate: string;
  endDate: string;
}

export interface BillingPreviewResponse {
  previewId: string;
  generatedAt: string;
  fingerprint: string;
  calculationSnapshot: {
    totalMilkAmount: string;
    totalFeedOutstanding: string;
    totalAdvanceOutstanding: string;
    milkEntryIds: string[];
    feedSaleIds: string[];
    advanceIds: string[];
  };
  farmer: {
    id: string;
    code: number;
    name: string;
    mobile: string;
    isActive: boolean;
  };
  billingPeriod: {
    cycleType: PaymentCycleType;
    startDate: string;
    endDate: string;
  };
  milkCollections: FarmerHistoryMilkItem[];
  milkSummary: {
    totalLitres: string;
    totalAmount: string;
  };
  feedSales: FarmerHistoryFeedItem[];
  feedSummary: {
    previousOutstanding: string;
    currentSales: string;
    totalOutstanding: string;
    deducted: string;
    remaining: string;
  };
  advanceHistory: FarmerHistoryAdvanceItem[];
  advanceSummary: {
    totalOutstanding: string;
    deducted: string;
    remaining: string;
  };
  settlementSummary: {
    grossAmount: string;
    totalDeductions: string;
    netPayable: string;
  };
}

export type SettlementStatus = 'FINALIZED' | 'CANCELLED';

export interface SettlementListParams {
  startDate?: string;
  endDate?: string;
  farmerId?: string;
  status?: SettlementStatus;
  settlementReference?: string;
  page?: number;
  limit?: number;
}

export interface SettlementListItem {
  id: string;
  settlementNumber: string;
  farmer: {
    id: string;
    code: number;
    name: string;
  };
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  milkAmount: string;
  totalDeductions: string;
  netPayable: string;
  status: SettlementStatus;
  finalizedAt: string;
}

export interface PaginatedSettlementList {
  data: SettlementListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SettlementDetailResponse {
  settlementId: string;
  settlementNumber: string;
  status: SettlementStatus;
  finalizedAt: string;
  finalizedBy: string | null;
  farmer: {
    id: string;
    code: number;
    name: string;
    mobile: string;
  };
  billingPeriod: {
    startDate: string;
    endDate: string;
    cycleType: string;
  };
  milkCollections: Array<{
    id: string;
    milkEntryId: string;
    date: string;
    shift: string;
    milkType: string;
    litres: string;
    fat: string;
    snf: string;
    rate: string;
    amount: string;
  }>;
  feedAllocations: Array<{
    id: string;
    foodSaleId: string;
    foodName: string;
    saleDate: string;
    originalAmount: string;
    previousPayments: string;
    previousPending: string;
    deductedAmount: string;
    remainingAmount: string;
  }>;
  advanceAllocations: Array<{
    id: string;
    advanceId: string;
    advanceNumber: string;
    givenDate: string;
    originalAmount: string;
    externalRepayments: string;
    previousPending: string;
    deductedAmount: string;
    remainingAmount: string;
  }>;
  summary: {
    totalLitres: string;
    grossMilkAmount: string;
    previousFeedOutstanding: string;
    currentFeedSales: string;
    totalFeedOutstanding: string;
    feedDeducted: string;
    remainingFeed: string;
    totalAdvanceOutstanding: string;
    advanceDeducted: string;
    remainingAdvance: string;
    totalDeductions: string;
    netPayable: string;
  };
}

