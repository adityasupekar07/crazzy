import {
  BillingCycleWindow,
  BillingCalculationResult,
  SupportedCycleType,
  FarmerHistoryMilkItem,
  FarmerHistoryFeedItem,
  FarmerHistoryAdvanceItem,
} from '../types/billing.types.js';

export interface BillingPreviewRequest {
  farmerId: string;
  cycleType: SupportedCycleType;
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
    cycleType: SupportedCycleType;
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

export interface BillingPreviewRequestDto {
  customerId: string;
  startDate: string;
  endDate: string;
  requestedFeedDeduction?: number;
  requestedAdvanceDeduction?: number;
}

export interface BillingPreviewResponseDto {
  customer: {
    id: string;
    code: number;
    name: string;
    mobile: string;
  };
  cycle: BillingCycleWindow;
  milkSummary: {
    totalLitres: number;
    grossAmount: number;
    avgFat: number;
    avgSnf: number;
    entryCount: number;
    entryIds: string[];
  };
  outstandingSummary: {
    pendingFeedAmount: number;
    pendingFeedSalesCount: number;
    pendingAdvanceAmount: number;
    activeAdvancesCount: number;
  };
  calculation: BillingCalculationResult;
}

