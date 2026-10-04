import { z } from "zod";

export const addCustomerSchema = z.object({
  customerCode: z.union([z.string(), z.number()]).optional(),
  code: z.union([z.string(), z.number()]).optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  mobile: z.string().min(10),
  address: z.string().optional(),
  milkType: z.enum(["COW", "BUFFALO", "MIX"]),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().optional(),
  name: z.string().optional(),
  mobile: z.string().min(10).optional(),
  address: z.string().optional(),
  milkType: z.enum(["COW", "BUFFALO", "MIX"]).optional(),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  ifscCode: z.string().optional(),
});