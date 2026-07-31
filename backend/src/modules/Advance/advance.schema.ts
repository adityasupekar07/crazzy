import { z } from "zod";

/**
 * =====================================================
 * CREATE ADVANCE
 * =====================================================
 */

export const createAdvanceSchema =
  z.object({

    customerId: z
      .string()
      .min(
        1,
        "Customer ID is required"
      ),

    amount: z
      .coerce
      .number()
      .positive(
        "Amount must be greater than 0"
      ),

    givenDate: z
      .string()
      .min(
        1,
        "Given date is required"
      )
      .refine(
        (date) => !isNaN(Date.parse(date)),
        {
          message: "Invalid date format",
        }
      ),

    notes: z
      .string()
      .max(
        500,
        "Notes cannot exceed 500 characters"
      )
      .optional(),
  });

/**
 * =====================================================
 * ADD REPAYMENT
 * =====================================================
 */

export const repaymentSchema =
  z.object({

    amount: z
      .coerce
      .number()
      .positive(
        "Repayment amount must be greater than 0"
      ),

    notes: z
      .string()
      .max(
        500,
        "Notes cannot exceed 500 characters"
      )
      .optional(),
  });

/**
 * =====================================================
 * PARAMS
 * =====================================================
 */

export const advanceIdParamSchema =
  z.object({

    advanceId: z
      .string()
      .min(
        1,
        "Advance ID is required"
      ),
  });

export const customerIdParamSchema =
  z.object({

    customerId: z
      .string()
      .min(
        1,
        "Customer ID is required"
      ),
  });

/**
 * =====================================================
 * GET ALL ADVANCES QUERY
 * =====================================================
 */

export const getAllAdvancesQuerySchema =
  z.object({

    page: z
      .coerce
      .number()
      .positive()
      .optional(),

    limit: z
      .coerce
      .number()
      .positive()
      .optional(),

    search: z
      .string()
      .optional(),

    status: z
      .enum([
        "ACTIVE",
        "PARTIALLY_RECOVERED",
        "CLOSED",
      ])
      .optional(),
  });