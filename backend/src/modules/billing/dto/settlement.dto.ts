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

