import { z } from 'zod';

export const billingPreviewSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  requestedFeedDeduction: z.number().min(0).optional(),
  requestedAdvanceDeduction: z.number().min(0).optional(),
});

export const billingPreviewRequestSchema = z.object({
  farmerId: z.string().trim().min(1, 'Farmer ID is required'),
  cycleType: z.enum(['TEN_DAY', 'FIFTEEN_DAY', 'MONTHLY', 'CUSTOM']),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
});

export const finalizeSettlementRequestSchema = z.object({
  previewId: z.string().trim().min(1, 'Preview ID is required'),
  farmerId: z.string().trim().min(1, 'Farmer ID is required'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
  idempotencyKey: z
    .string()
    .trim()
    .min(1, 'Idempotency key is required')
    .max(200, 'Idempotency key must be at most 200 characters'),
});

export const createSettlementSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalAmount: z.number().min(0, 'Total bill amount cannot be negative'),
  advanceDeductionAmount: z.number().min(0, 'Advance deduction cannot be negative').optional().default(0),
  feedDeductionAmount: z.number().min(0, 'Feed deduction cannot be negative').optional().default(0),
  netPayable: z.number().min(0, 'Net payable cannot be negative').optional(),
  litres: z.number().min(0).optional().default(0),
  avgFat: z.number().min(0).optional().default(0),
  avgSnf: z.number().min(0).optional().default(0),
  milkEntryIds: z.array(z.string()).optional().default([]),
  remarks: z.string().optional(),
});

export const billingHistoryQuerySchema = z.object({
  customerId: z.string().optional(),
});

export const billingFarmersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const farmerHistoryParamsSchema = z.object({
  farmerId: z.string().trim().min(1, 'Farmer ID is required'),
});

export const farmerHistoryQuerySchema = z.object({
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
});

