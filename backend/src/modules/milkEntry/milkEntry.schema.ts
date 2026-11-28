import { z } from "zod";

/**
 * =====================================================
 * ADD ENTRY
 * =====================================================
 */
export const addMilkEntrySchema = z.object({
  customerCode: z.string().optional(),
  code: z.number().optional(),
  customerId: z.string().optional(),
  date: z.string().optional(),
  shift: z.enum(["MORNING", "EVENING", "BOTH"]),
  milkType: z.enum(["COW", "BUFFALO", "MIX"]),
  quantity: z.number().positive("Quantity must be greater than 0"),
  fat: z.number().positive("Fat must be greater than 0"),
  snf: z.number().positive("SNF must be greater than 0").optional(),
  rate: z.number().optional(),
  totalAmount: z.number().optional(),
});

/**
 * =====================================================
 * UPDATE ENTRY (Audited Correction)
 * =====================================================
 */
export const updateMilkEntrySchema = z.object({
  quantity: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  snf: z.number().positive().optional(),
  milkType: z.enum(["COW", "BUFFALO", "MIX"]).optional(),
  rate: z.number().optional(),
  totalAmount: z.number().optional(),
  reason: z.string().min(3, "Correction reason must be at least 3 characters").optional(),
});
