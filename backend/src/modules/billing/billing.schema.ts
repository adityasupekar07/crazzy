import { z } from 'zod';

export const createSettlementSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalAmount: z.number().min(0, 'Total bill amount cannot be negative'),
  advanceDeductionAmount: z.number().min(0, 'Advance deduction cannot be negative').optional().default(0),
  netPayable: z.number().min(0, 'Net payable cannot be negative').optional(),
  litres: z.number().min(0).optional().default(0),
  avgFat: z.number().min(0).optional().default(0),
  avgSnf: z.number().min(0).optional().default(0),
  milkEntryIds: z.array(z.string()).optional().default([]),
  remarks: z.string().optional(),
});
