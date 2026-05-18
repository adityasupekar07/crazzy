import { z }
from "zod";

/**
 * =====================================================
 * ADD ENTRY
 * =====================================================
 */

export const addMilkEntrySchema =
    z.object({
        customerCode:
            z.string(),

        date:
            z.string(),

        shift:
            z.enum([
                "MORNING",
                "EVENING",
                "BOTH",
            ]),

        milkType:
            z.enum([
                "COW",
                "BUFFALO",
                "MIX",
            ]),

        quantity:
            z.number(),

        fat:
            z.number()
            .optional(),

        snf:
            z.number()
            .optional(),

        rate:
            z.number()
            .optional(),

        totalAmount:
            z.number()
            .optional(),
    });

/**
 * =====================================================
 * UPDATE ENTRY
 * =====================================================
 */

export const updateMilkEntrySchema =
    z.object({
        quantity:
            z.number()
            .optional(),

        fat:
            z.number()
            .optional(),

        snf:
            z.number()
            .optional(),

        rate:
            z.number()
            .optional(),

        totalAmount:
            z.number()
            .optional(),
    });