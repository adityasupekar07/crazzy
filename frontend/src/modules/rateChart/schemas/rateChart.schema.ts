import { z } from 'zod';

export const milkTypeEnum = z.enum(['COW', 'BUFFALO', 'MIX']);
export const chartTypeEnum = z.enum(['POINT', 'EXCEL']);
export const rateMethodEnum = z.enum(['FAT_SNF', 'FAT_ONLY', 'FIXED']);
export const ruleAxisEnum = z.enum(['FAT', 'SNF']);

export const fatStepSchema = z.object({
  startValue: z.coerce.number().min(0, 'FAT start value must be >= 0'),
  increment: z.coerce.number().gt(0, 'FAT step increment must be > 0'),
});

export const snfStepSchema = z.object({
  startValue: z.coerce.number().min(0, 'SNF start value must be >= 0'),
  increment: z.coerce.number().gt(0, 'SNF step increment must be > 0'),
});

export const ruleSchema = z
  .object({
    axis: ruleAxisEnum,
    fromValue: z.coerce.number().min(0, 'From value must be >= 0'),
    toValue: z.coerce.number().min(0, 'To value must be >= 0'),
    amount: z.coerce.number(),
  })
  .refine((data) => data.fromValue < data.toValue, {
    message: 'From value must be strictly less than To value',
    path: ['toValue'],
  });

export const excelMatrixSchema = z.object({
  fatHeader: z.array(z.number().min(0)).min(1, 'At least one FAT header column required'),
  snfHeader: z.array(z.number().min(0)).min(1, 'At least one SNF header row required'),
  rates: z.array(z.array(z.number().min(0))),
});

export const rateChartFormSchema = z.object({
  name: z.string().min(2, 'Chart name must be at least 2 characters').max(100, 'Chart name must be under 100 characters'),
  milkType: milkTypeEnum,
  chartType: chartTypeEnum.default('POINT'),
  method: rateMethodEnum.default('FAT_SNF'),
  baseRate: z.coerce.number().min(0, 'Base rate cannot be negative'),

  fatSteps: z.array(fatStepSchema).default([]),
  snfSteps: z.array(snfStepSchema).default([]),
  rules: z.array(ruleSchema).default([]),
  excelMatrix: excelMatrixSchema.optional(),
});

export type RateChartFormValues = z.infer<typeof rateChartFormSchema>;
