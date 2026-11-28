import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import {
  BillingCalculationInput,
  BillingCalculationResult,
  MilkEntryItem,
} from '../types/billing.types.js';

/**
 * Pure financial calculation utilities for the Billing module.
 * Zero dependency on Express or Prisma so all math is trivially unit-testable.
 */
export function roundCurrency(value: number | string | Decimal): number {
  return new Decimal(value.toString())
    .toDecimalPlaces(2, ROUND_HALF_UP)
    .toNumber();
}

export function calculateWeightedMilkStats(entries: MilkEntryItem[]): {
  totalLitres: number;
  grossAmount: number;
  avgFat: number;
  avgSnf: number;
} {
  if (entries.length === 0) {
    return { totalLitres: 0, grossAmount: 0, avgFat: 0, avgSnf: 0 };
  }

  let totalLitres = new Decimal(0);
  let grossAmount = new Decimal(0);
  let weightedFat = new Decimal(0);
  let weightedSnf = new Decimal(0);

  for (const entry of entries) {
    const qty = new Decimal(entry.quantity.toString());
    const amt = new Decimal(entry.totalAmount.toString());
    const fat = new Decimal(entry.fat.toString());
    const snf = new Decimal(entry.snf.toString());

    totalLitres = totalLitres.plus(qty);
    grossAmount = grossAmount.plus(amt);
    weightedFat = weightedFat.plus(qty.times(fat));
    weightedSnf = weightedSnf.plus(qty.times(snf));
  }

  const avgFat = totalLitres.greaterThan(0)
    ? weightedFat.dividedBy(totalLitres).toDecimalPlaces(2, ROUND_HALF_UP).toNumber()
    : 0;

  const avgSnf = totalLitres.greaterThan(0)
    ? weightedSnf.dividedBy(totalLitres).toDecimalPlaces(2, ROUND_HALF_UP).toNumber()
    : 0;

  return {
    totalLitres: totalLitres.toDecimalPlaces(2, ROUND_HALF_UP).toNumber(),
    grossAmount: grossAmount.toDecimalPlaces(2, ROUND_HALF_UP).toNumber(),
    avgFat,
    avgSnf,
  };
}

export function computeBillingDeductions(
  input: BillingCalculationInput
): BillingCalculationResult {
  const gross = Decimal.max(0, new Decimal(input.grossMilkAmount.toString()));
  const pendingFeed = Decimal.max(0, new Decimal(input.totalPendingFeed.toString()));
  const pendingAdvance = Decimal.max(0, new Decimal(input.totalPendingAdvance.toString()));

  const feedDeduction =
    input.requestedFeedDeduction !== undefined
      ? Decimal.min(
          Decimal.max(0, new Decimal(input.requestedFeedDeduction.toString())),
          pendingFeed,
          gross
        )
      : new Decimal(0);

  const remainingAfterFeed = Decimal.max(0, gross.minus(feedDeduction));

  const advanceDeduction =
    input.requestedAdvanceDeduction !== undefined
      ? Decimal.min(
          Decimal.max(0, new Decimal(input.requestedAdvanceDeduction.toString())),
          pendingAdvance,
          remainingAfterFeed
        )
      : new Decimal(0);

  const totalDeductions = feedDeduction.plus(advanceDeduction);
  const netPayable = Decimal.max(0, gross.minus(totalDeductions));

  return {
    grossMilkAmount: roundCurrency(gross),
    feedDeductionAmount: roundCurrency(feedDeduction),
    advanceDeductionAmount: roundCurrency(advanceDeduction),
    totalDeductions: roundCurrency(totalDeductions),
    netPayable: roundCurrency(netPayable),
    remainingFeedBalance: roundCurrency(pendingFeed.minus(feedDeduction)),
    remainingAdvanceBalance: roundCurrency(pendingAdvance.minus(advanceDeduction)),
  };
}

