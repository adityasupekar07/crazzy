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