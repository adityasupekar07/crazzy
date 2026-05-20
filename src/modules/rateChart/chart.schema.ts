import { z } from "zod";

export const createRateChartSchema = z.object({
  name: z.string().min(2),

  type: z.enum([
    "FIXED",
    "FAT",
    "FAT_SNF",
    "FAT_SNF_STEP",
    "FAT_SNF_PER_KG",
    "MATRIX",
  ]),

  milkType: z.enum([
    "COW",
    "BUFFALO",
    "MIX",
  ]),

  shift: z.enum([
    "MORNING",
    "EVENING",
    "BOTH",
  ]),

  isDefault: z.boolean().optional(),

  rule: z
    .object({
      fixedRate: z.number().optional(),

      baseFat: z.number().optional(),

      baseSnf: z.number().optional(),

      baseRate: z.number().optional(),

      fatStep: z.number().optional(),

      fatRateIncrement:
        z.number().optional(),

      snfStep: z.number().optional(),

      snfRateIncrement:
        z.number().optional(),

      fatRatePerKg:
        z.number().optional(),

      snfRatePerKg:
        z.number().optional(),
    })
    .optional(),
});

export const createMatrixRatesSchema =
  z.object({
    rateChartId: z.string().cuid(),

    rates: z.array(
      z.object({
        fat: z.number(),

        snf: z.number(),

        rate: z.number(),
      })
    ),
  });