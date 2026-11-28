import { PaymentPeriod } from '@prisma/client';

export type SupportedCycleType = 'TEN_DAY' | 'FIFTEEN_DAY' | 'MONTHLY' | 'CUSTOM';

export interface CycleOption {
  type: SupportedCycleType;
  label: string;
}

export interface BillingCycleWindow {
  startDate: string; // YYYY-MM-DD (IST)
  endDate: string;   // YYYY-MM-DD (IST)
  periodType: PaymentPeriod | SupportedCycleType;
}

export interface MilkEntryItem {
  id: string;
  date: Date;
  shift: string;
  milkType: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  totalAmount: number;
}

export interface FarmerMilkSummary {
  totalLitres: number;
  grossAmount: number;
  avgFat: number;
  avgSnf: number;
  entryCount: number;
  entryIds: string[];
  entries: MilkEntryItem[];
}

export interface PendingFeedSaleItem {
  id: string;
  foodName: string;
  quantity: number;
  sellRate: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  saleDate: Date;
}

export interface FarmerFeedSummary {
  totalPendingFeed: number;
  pendingSalesCount: number;
  pendingSales: PendingFeedSaleItem[];
}

export interface PendingAdvanceItem {
  id: string;
  advanceNumber: string;
  originalAmount: number;
  recoveredAmount: number;
  pendingAmount: number;
  status: string;
  givenDate: Date;
}

export interface FarmerAdvanceSummary {
  totalPendingAdvance: number;
  activeAdvancesCount: number;
  activeAdvances: PendingAdvanceItem[];
}

export interface FarmerConsolidatedHistory {
  customerId: string;
  customerCode: number;
  customerName: string;
  customerMobile: string;
  cycle: BillingCycleWindow;
  milk: FarmerMilkSummary;
  feed: FarmerFeedSummary;
  advance: FarmerAdvanceSummary;
}

export interface BillingCalculationInput {
  grossMilkAmount: number;
  totalPendingFeed: number;
  totalPendingAdvance: number;
  requestedFeedDeduction?: number;
  requestedAdvanceDeduction?: number;
}

export interface BillingCalculationResult {
  grossMilkAmount: number;
  feedDeductionAmount: number;
  advanceDeductionAmount: number;
  totalDeductions: number;
  netPayable: number;
  remainingFeedBalance: number;
  remainingAdvanceBalance: number;
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
  date: string; // YYYY-MM-DD (IST)
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
  saleDate: string; // YYYY-MM-DD (IST)
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
  date: string; // YYYY-MM-DD (IST)
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

export interface SettlementRecord {
  id: string;
  adminId: string;
  customerId: string;
  customerName: string;
  customerCode: number;
  startDate: string;
  endDate: string;
  period: string;
  litres: number;
  avgFat: number;
  avgSnf: number;
  grossAmount: number;
  feedDeductionAmount?: number;
  advanceDeductionAmount: number;
  netPayable: number;
  milkEntryCount: number;
  milkEntryIds: string[];
  remarks?: string;
  createdAt: string;
}

