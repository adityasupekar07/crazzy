import { SettlementRecord } from '../types/billing.types.js';

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

