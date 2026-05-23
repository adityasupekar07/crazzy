import { z } from "zod";
/**
 * FAT STEP SCHEMA
 */
const fatStepSchema = z.object({
    startValue: z.number(),
    increment: z.number(),
});
/**
 * SNF STEP SCHEMA
 */
const snfStepSchema = z.object({
    startValue: z.number(),
    increment: z.number(),
});
/**
 * BONUS / PENALTY RULE SCHEMA
 */
const ruleSchema = z.object({
    axis: z.enum([
        "FAT",
        "SNF",
    ]),
    fromValue: z.number(),
    toValue: z.number(),
    amount: z.number(),
});
/**
 * CREATE RATE CHART
 */
export const createChartSchema = {
    body: z.object({
        /**
         * BASIC INFO
         */
        name: z
            .string()
            .min(2, "Chart name required"),
        milkType: z.enum([
            "COW",
            "BUFFALO",
            "MIX",
        ]),
        category: z.enum([
            "COLLECTION",
            "SALE",
        ]),
        chartType: z.enum([
            "POINT",
            "EXCEL",
        ]),
        method: z.enum([
            "FAT_SNF",
            "FAT_ONLY",
            "FIXED",
        ]),
        /**
         * BASE RATE
         */
        baseRate: z.number(),
        /**
         * FAT STEPS
         */
        fatSteps: z
            .array(fatStepSchema)
            .min(1, "At least one fat step required"),
        /**
         * SNF STEPS
         */
        snfSteps: z
            .array(snfStepSchema)
            .min(1, "At least one snf step required"),
        /**
         * BONUS / PENALTY RULES
         */
        rules: z
            .array(ruleSchema)
            .optional(),
    }),
};
/**
 * UPDATE RATE CHART
 */
export const updateChartSchema = {
    body: z.object({
        name: z
            .string()
            .min(2, "Chart name invalid")
            .optional(),
        milkType: z
            .enum([
            "COW",
            "BUFFALO",
            "MIX",
        ])
            .optional(),
        category: z
            .enum([
            "COLLECTION",
            "SALE",
        ])
            .optional(),
        chartType: z
            .enum([
            "POINT",
            "EXCEL",
        ])
            .optional(),
        method: z
            .enum([
            "FAT_SNF",
            "FAT_ONLY",
            "FIXED",
        ])
            .optional(),
        baseRate: z
            .number()
            .optional(),
        fatSteps: z
            .array(fatStepSchema)
            .optional(),
        snfSteps: z
            .array(snfStepSchema)
            .optional(),
        rules: z
            .array(ruleSchema)
            .optional(),
    }),
};
/**
 * PARAM VALIDATION
 */
export const chartIdSchema = {
    params: z.object({
        id: z.string().cuid(),
    }),
};
