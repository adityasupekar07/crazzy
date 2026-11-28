import { SettlementRecord } from '../types/billing.types.js';

export interface FinalizeSettlementRequestDto {
  previewId: string;
  farmerId: string;
  startDate: string;
  endDate: string;
  idempotencyKey: string;
}

export interface FinalizeSettlementResponseDto {
  settlementId: string;
  settlementNumber: string;
  status: 'FINALIZED' | 'CANCELLED';
  farmerId: string;
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  milkSummary: {
    totalLitres: string;
    totalAmount: string;
  };
  feedSummary: {
    totalOutstanding: string;
    deducted: string;
    remaining: string;
  };
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
  settledAt: string;
}

export interface SettlementListQueryDto {
  startDate?: string;
  endDate?: string;
  farmerId?: string;
  status?: 'FINALIZED' | 'CANCELLED';
  settlementReference?: string;
  page: number;
  limit: number;
}

export interface SettlementListItemDto {
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
  status: 'FINALIZED' | 'CANCELLED';
  finalizedAt: string;
}

export interface PaginatedSettlementListDto {
  data: SettlementListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SettlementDetailMilkItemDto {
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
}

export interface SettlementDetailFeedItemDto {
  id: string;
  foodSaleId: string;
  foodName: string;
  saleDate: string;
  originalAmount: string;
  previousPayments: string;
  previousPending: string;
  deductedAmount: string;
  remainingAmount: string;
}

export interface SettlementDetailAdvanceItemDto {
  id: string;
  advanceId: string;
  advanceNumber: string;
  givenDate: string;
  originalAmount: string;
  externalRepayments: string;
  previousPending: string;
  deductedAmount: string;
  remainingAmount: string;
}

export interface SettlementDetailDto {
  settlementId: string;
  settlementNumber: string;
  status: 'FINALIZED' | 'CANCELLED';
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
  milkCollections: SettlementDetailMilkItemDto[];
  feedAllocations: SettlementDetailFeedItemDto[];
  advanceAllocations: SettlementDetailAdvanceItemDto[];
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

export interface CreateSettlementRequestDto {
  customerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  advanceDeductionAmount?: number;
  feedDeductionAmount?: number;
  netPayable?: number;
  litres?: number;
  avgFat?: number;
  avgSnf?: number;
  milkEntryIds?: string[];
  remarks?: string;
}

export type SettlementResponseDto = SettlementRecord;

