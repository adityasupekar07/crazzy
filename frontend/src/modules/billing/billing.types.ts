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

