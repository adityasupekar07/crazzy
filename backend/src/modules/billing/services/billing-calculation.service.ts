import { Decimal } from 'decimal.js';
import ApiError from '../../../utils/ApiError.js';
import {
  BillingCalculationInput as LegacyBillingCalculationInput,
  BillingCalculationResult as LegacyBillingCalculationResult,
} from '../types/billing.types.js';
import { computeBillingDeductions } from '../utils/billing-calculation.utils.js';

/**
 * Isolated Decimal configuration for monetary arithmetic:
 * - precision 40 supports very large monetary values without loss of precision
 * - ROUND_HALF_UP explicit rounding policy
 */
const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

const MONETARY_FORMAT_REGEX = /^\d+(?:\.\d{1,2})?$/;

export interface BillingCalculationInput {
  totalMilkAmount: string;
  totalFeedOutstanding: string;
  totalAdvanceOutstanding: string;
}

export interface BillingCalculationResult {
  totalMilkAmount: string;

  totalFeedOutstanding: string;
  feedDeducted: string;
  remainingFeed: string;

  totalAdvanceOutstanding: string;
  advanceDeducted: string;
  remainingAdvance: string;

  finalPayable: string;
}

function parseMonetaryInput(value: unknown, fieldName: string): Decimal {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a decimal string`);
  }
  if (value.length === 0 || value.trim() !== value) {
    throw new ApiError(400, `${fieldName} must be a non-empty monetary string without surrounding whitespace`);
  }
  if (!MONETARY_FORMAT_REGEX.test(value)) {
    throw new ApiError(
      400,
      `${fieldName} has invalid monetary format or unsupported precision (max 2 decimal places): "${value}"`
    );
  }

  const parsed = new MoneyDecimal(value);
  if (parsed.isNaN() || !parsed.isFinite() || parsed.isNegative()) {
    throw new ApiError(400, `${fieldName} must be a finite non-negative decimal`);
  }

  return parsed.toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP);
}

function formatMoney(value: Decimal): string {
  return value.toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP).toFixed(2);
}

function assertFinancialInvariants(params: {
  milkAmount: Decimal;
  feedOutstanding: Decimal;
  advanceOutstanding: Decimal;
  feedDeducted: Decimal;
  remainingFeed: Decimal;
  remainingMilk: Decimal;
  advanceDeducted: Decimal;
  remainingAdvance: Decimal;
  finalPayable: Decimal;
}): void {
  const {
    milkAmount,
    feedOutstanding,
    advanceOutstanding,
    feedDeducted,
    remainingFeed,
    remainingMilk,
    advanceDeducted,
    remainingAdvance,
    finalPayable,
  } = params;

  const nonNegativeFields = [
    milkAmount,
    feedOutstanding,
    advanceOutstanding,
    feedDeducted,
    remainingFeed,
    remainingMilk,
    advanceDeducted,
    remainingAdvance,
    finalPayable,
  ];
  if (nonNegativeFields.some((v) => v.isNegative())) {
    throw new ApiError(500, 'Billing calculation invariant failed: negative monetary value');
  }

  if (feedDeducted.greaterThan(milkAmount) || feedDeducted.greaterThan(feedOutstanding)) {
    throw new ApiError(500, 'Billing calculation invariant failed: feed deduction exceeds bounds');
  }

  if (
    advanceDeducted.greaterThan(remainingMilk) ||
    advanceDeducted.greaterThan(advanceOutstanding)
  ) {
    throw new ApiError(500, 'Billing calculation invariant failed: advance deduction exceeds bounds');
  }

  if (!feedDeducted.plus(advanceDeducted).plus(finalPayable).equals(milkAmount)) {
    throw new ApiError(500, 'Billing calculation invariant failed: milk reconciliation mismatch');
  }

  if (!feedDeducted.plus(remainingFeed).equals(feedOutstanding)) {
    throw new ApiError(500, 'Billing calculation invariant failed: feed reconciliation mismatch');
  }

  if (!advanceDeducted.plus(remainingAdvance).equals(advanceOutstanding)) {
    throw new ApiError(500, 'Billing calculation invariant failed: advance reconciliation mismatch');
  }
}

/**
 * Pure, deterministic billing settlement calculation engine.
 * Enforces mandatory deduction order: Feed outstanding first, then Advance outstanding.
 */
export function calculateBillingSettlement(
  input: BillingCalculationInput
): BillingCalculationResult {
  const milkAmount = parseMonetaryInput(input.totalMilkAmount, 'totalMilkAmount');
  const feedOutstanding = parseMonetaryInput(input.totalFeedOutstanding, 'totalFeedOutstanding');
  const advanceOutstanding = parseMonetaryInput(
    input.totalAdvanceOutstanding,
    'totalAdvanceOutstanding'
  );

  // STEP 1: Feed outstanding deducted first
  const feedDeducted = MoneyDecimal.min(milkAmount, feedOutstanding);

  // STEP 2: Remaining feed balance
  const remainingFeed = feedOutstanding.minus(feedDeducted);

  // STEP 3: Remaining milk amount after feed deduction
  const remainingMilk = milkAmount.minus(feedDeducted);

  // STEP 4: Advance outstanding deducted from remaining milk
  const advanceDeducted = MoneyDecimal.min(remainingMilk, advanceOutstanding);

  // STEP 5: Remaining advance balance
  const remainingAdvance = advanceOutstanding.minus(advanceDeducted);

  // STEP 6: Final payable to farmer
  const finalPayable = remainingMilk.minus(advanceDeducted);

  assertFinancialInvariants({
    milkAmount,
    feedOutstanding,
    advanceOutstanding,
    feedDeducted,
    remainingFeed,
    remainingMilk,
    advanceDeducted,
    remainingAdvance,
    finalPayable,
  });

  return {
    totalMilkAmount: formatMoney(milkAmount),
    totalFeedOutstanding: formatMoney(feedOutstanding),
    feedDeducted: formatMoney(feedDeducted),
    remainingFeed: formatMoney(remainingFeed),
    totalAdvanceOutstanding: formatMoney(advanceOutstanding),
    advanceDeducted: formatMoney(advanceDeducted),
    remainingAdvance: formatMoney(remainingAdvance),
    finalPayable: formatMoney(finalPayable),
  };
}

/**
 * Pure billing calculation engine.
 * Independent of Express and Prisma for unit-testability and bulk settlement reuse.
 */
export class BillingCalculationService {
  public static calculateSettlement(
    input: BillingCalculationInput
  ): BillingCalculationResult {
    return calculateBillingSettlement(input);
  }

  public static calculate(
    input: LegacyBillingCalculationInput
  ): LegacyBillingCalculationResult {
    return computeBillingDeductions(input);
  }
}
