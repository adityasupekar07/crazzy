import { z } from "zod";

/**
 * =====================================================
 * CREATE FOOD DEALER
 * =====================================================
 */

export const createFoodDealerSchema =
    z.object({
        code:
            z
                .string()
                .trim()
                .min(
                    2,
                    "Dealer code is required"
                )
                .max(
                    20,
                    "Dealer code too long"
                ),

        name:
            z
                .string()
                .trim()
                .min(
                    2,
                    "Dealer name is required"
                )
                .max(
                    100,
                    "Dealer name too long"
                ),

        phone:
            z
                .string()
                .trim()
                .regex(
                    /^[6-9]\d{9}$/,
                    "Invalid mobile number"
                )
                .optional(),

        address:
            z
                .string()
                .trim()
                .max(
                    300,
                    "Address too long"
                )
                .optional(),

        isActive:
            z.boolean().optional(),
    });

/**
 * =====================================================
 * UPDATE FOOD DEALER
 * =====================================================
 */

export const updateFoodDealerSchema =
    createFoodDealerSchema.partial();