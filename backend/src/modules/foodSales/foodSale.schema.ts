import { z }
    from "zod";

/**
 * =====================================================
 * CREATE FOOD SALE
 * =====================================================
 */

export const createFoodSaleSchema =
    z.object({

        customerId:
            z
                .string()
                .min(
                    1,
                    "Customer is required"
                ),

        foodPurchaseId:
            z
                .string()
                .min(
                    1,
                    "Food purchase is required"
                ),

        quantity:
            z.coerce
                .number()
                .positive(
                    "Quantity must be greater than 0"
                ),

        amountPaid:
            z.coerce
                .number()
                .min(
                    0,
                    "Amount paid cannot be negative"
                ),

        isCashPayment:
            z.boolean(),

        saleDate:
            z.string(),
    });

/**
 * =====================================================
 * UPDATE FOOD SALE
 * =====================================================
 */

export const updateFoodSaleSchema =
    z.object({

        amountPaid:
            z.coerce
                .number()
                .min(
                    0,
                    "Amount paid cannot be negative"
                )
                .optional(),

        isCashPayment:
            z.boolean().optional(),

        saleDate:
            z.string().optional(),
    });