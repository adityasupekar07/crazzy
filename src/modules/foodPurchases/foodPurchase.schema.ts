import { z }
from "zod";

/**
 * =====================================================
 * CREATE FOOD PURCHASE
 * =====================================================
 */

export const createFoodPurchaseSchema =
    z.object({

        dealerId:
            z
                .string()
                .min(
                    1,
                    "Dealer is required"
                ),

        foodName:
            z
                .string()
                .trim()
                .min(
                    2,
                    "Food name is required"
                ),

        quantity:
            z
                .number()
                .positive(
                    "Quantity must be greater than 0"
                ),

        buyRate:
            z
                .number()
                .positive(
                    "Buy rate must be greater than 0"
                ),

        sellRate:
            z
                .number()
                .positive(
                    "Sell rate must be greater than 0"
                ),

        amountPaid:
            z
                .number()
                .min(
                    0,
                    "Amount paid cannot be negative"
                ),

        purchaseDate:
            z.string(),
    });