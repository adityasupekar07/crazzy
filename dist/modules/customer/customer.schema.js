import { z } from "zod";
export const addCustomerSchema = z.object({
    code: z.number(),
    name: z.string()
        .min(2),
    mobile: z.string()
        .min(10),
    address: z.string()
        .optional(),
    milkType: z.enum([
        "COW",
        "BUFFALO",
        "MIX",
    ]),
});
