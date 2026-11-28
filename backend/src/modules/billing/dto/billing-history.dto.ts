import { SettlementRecord } from '../types/billing.types.js';

export interface BillingHistoryQueryDto {
  customerId?: string;
}

export type BillingHistoryResponseDto = SettlementRecord[];

