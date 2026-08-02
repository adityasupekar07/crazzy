import { z } from "zod";

/**
 * COMMON ENUMS & STEPS
 */

export const milkTypeEnum = z.enum(["COW", "BUFFALO", "MIX"]);
export const chartTypeEnum = z.enum(["POINT", "EXCEL"]);
export const rateMethodEnum = z.enum(["FAT_SNF", "FAT_ONLY", "FIXED"]);
export const ruleAxisEnum = z.enum(["FAT", "SNF"]);

export const fatStepSchema = z.object({
  startValue: z.number().min(0, "FAT start value must be >= 0"),
  increment: z.number().gt(0, "FAT step increment must be > 0"),
});

export const snfStepSchema = z.object({
  startValue: z.number().min(0, "SNF start value must be >= 0"),
  increment: z.number().gt(0, "SNF step increment must be > 0"),
});

export const ruleSchema = z
  .object({
    axis: ruleAxisEnum,
    fromValue: z.number().min(0, "From value must be >= 0"),
    toValue: z.number().min(0, "To value must be >= 0"),
    amount: z.number(), // Can be positive (bonus) or negative (penalty)
  })
  .refine((data) => data.fromValue < data.toValue, {
    message: "fromValue must be strictly less than toValue",
    path: ["toValue"],
  });

export const excelMatrixSchema = z.object({
  fatHeader: z.array(z.number().min(0)).min(1, "At least one FAT header column required"),
  snfHeader: z.array(z.number().min(0)).min(1, "At least one SNF header row required"),
  rates: z.array(z.array(z.number().min(0))),
});

/**
 * CREATE RATE CHART SCHEMA
 */
export const createChartSchema = {
  body: z.object({
    name: z.string().min(2, "Chart name must be at least 2 characters").max(100),
    milkType: milkTypeEnum,
    chartType: chartTypeEnum.default("POINT"),
    method: rateMethodEnum.default("FAT_SNF"),
    baseRate: z.number().min(0, "Base rate cannot be negative").default(0),

    // Point-based steps & rules
    fatSteps: z.array(fatStepSchema).optional().default([]),
    snfSteps: z.array(snfStepSchema).optional().default([]),
    rules: z.array(ruleSchema).optional().default([]),

    // Excel-based matrix configuration
    excelMatrix: excelMatrixSchema.optional(),
  }),
};

/**
 * UPDATE RATE CHART SCHEMA (DRAFT ONLY)
 */
export const updateChartSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    milkType: milkTypeEnum.optional(),
    chartType: chartTypeEnum.optional(),
    method: rateMethodEnum.optional(),
    baseRate: z.number().min(0).optional(),
    fatSteps: z.array(fatStepSchema).optional(),
    snfSteps: z.array(snfStepSchema).optional(),
    rules: z.array(ruleSchema).optional(),
    excelMatrix: excelMatrixSchema.optional(),
  }),
};

/**
 * PARAM VALIDATION
 */
export const chartIdSchema = {
  params: z.object({
    id: z.string().min(1, "Chart ID is required"),
  }),
};

/**
 * QUERY SCHEMAS (PAGINATION & FILTERS)
 */
export const getChartsQuerySchema = {
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    milkType: milkTypeEnum.optional(),
    chartType: chartTypeEnum.optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
};

export const activeChartQuerySchema = {
  query: z.object({
    milkType: milkTypeEnum.optional(),
    chartType: chartTypeEnum.optional(),
    method: rateMethodEnum.optional(),
  }),
};

/**
 * PREVIEW & EXCEL VALIDATION SCHEMAS
 */
export const previewChartSchema = {
  body: z.object({
    method: rateMethodEnum.default("FAT_SNF"),
    baseRate: z.number().min(0).default(0),
    fatSteps: z.array(fatStepSchema).optional().default([]),
    snfSteps: z.array(snfStepSchema).optional().default([]),
    rules: z.array(ruleSchema).optional().default([]),
    excelMatrix: excelMatrixSchema.optional(),
    sampleFat: z.number().min(0).optional().default(3.5),
    sampleSnf: z.number().min(0).optional().default(8.5),
  }),
};

export const validateExcelSchema = {
  body: z.object({
    excelMatrix: excelMatrixSchema,
  }),
};

export const calculateRateSchema = {
  body: z.object({
    milkType: milkTypeEnum,
    fat: z.number().min(0, "FAT must be >= 0"),
    snf: z.number().min(0, "SNF must be >= 0"),
    quantity: z.number().gt(0, "Quantity must be > 0").default(1),
    method: rateMethodEnum.optional().default("FAT_SNF"),
  }),
};