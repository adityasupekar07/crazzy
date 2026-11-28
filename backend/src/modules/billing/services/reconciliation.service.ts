import { Decimal } from 'decimal.js';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';

const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function toMoney(val: Decimal.Value): Decimal {
  return new MoneyDecimal(val.toString()).toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP);
}

export interface ReconcilableFeedSale {
  id: string;
  adminId?: string;
  customerId?: string;
  totalAmount: number | string | Decimal;
  amountPaid: number | string | Decimal;
  pendingAmount: number | string | Decimal;
  settlementAllocations: Array<{
    settlementId: string;
    allocatedAmount: number | string | Decimal;
    settlement?: { status: string } | null;
  }>;
}

export interface ReconcilableAdvance {
  id: string;
  advanceNumber?: string;
  adminId?: string;
  customerId?: string;
  originalAmount: number | string | Decimal;
  recoveredAmount: number | string | Decimal;
  pendingAmount: number | string | Decimal;
  transactions: Array<{
    id: string;
    type: string;
    amount: number | string | Decimal;
    settlementId?: string | null;
    settlement?: { status: string } | null;
  }>;
  settlementAllocations: Array<{
    settlementId: string;
    allocatedAmount: number | string | Decimal;
    settlement?: { status: string } | null;
  }>;
}

/**
 * Verifies financial reconciliation invariants for Feed Sales and Advances
 * across billing cycles without silently repairing inconsistencies.
 */
export class ReconciliationService {
  public static reconcileFeedSale(sale: ReconcilableFeedSale): {
    originalAmount: Decimal;
    validExternalPayments: Decimal;
    validSettlementAllocations: Decimal;
    remainingBalance: Decimal;
  } {
    const original = toMoney(sale.totalAmount);
    const amountPaid = toMoney(sale.amountPaid);
    const pending = toMoney(sale.pendingAmount);

    if (original.isNegative() || amountPaid.isNegative() || pending.isNegative()) {
      logger.error('Feed reconciliation failed: negative balance detected', {
        foodSaleId: sale.id,
        original: original.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        pending: pending.toFixed(2),
      });
      throw new ApiError(422, `Negative balance detected on feed sale ${sale.id}`, {
        code: 'FEED_NEGATIVE_BALANCE',
      });
    }

    const seenSettlements = new Set<string>();
    let validAllocations = new MoneyDecimal(0);

    for (const alloc of sale.settlementAllocations) {
      if (alloc.settlement?.status === 'CANCELLED') {
        continue;
      }
      if (seenSettlements.has(alloc.settlementId)) {
        logger.error('Feed reconciliation failed: duplicate settlement allocation', {
          foodSaleId: sale.id,
          settlementId: alloc.settlementId,
        });
        throw new ApiError(
          422,
          `Duplicate settlement allocation detected for feed sale ${sale.id}`,
          { code: 'FEED_DUPLICATE_ALLOCATION' }
        );
      }
      seenSettlements.add(alloc.settlementId);
      validAllocations = validAllocations.plus(toMoney(alloc.allocatedAmount));
    }

    if (validAllocations.greaterThan(original)) {
      logger.error('Feed reconciliation failed: allocations exceed original sale amount', {
        foodSaleId: sale.id,
        original: original.toFixed(2),
        validAllocations: validAllocations.toFixed(2),
      });
      throw new ApiError(
        422,
        `Feed settlement allocations exceed original sale amount on ${sale.id}`,
        { code: 'FEED_ALLOCATION_EXCEEDS_ORIGINAL' }
      );
    }

    if (amountPaid.lessThan(validAllocations)) {
      logger.error('Feed reconciliation failed: amountPaid is less than finalized allocations', {
        foodSaleId: sale.id,
        amountPaid: amountPaid.toFixed(2),
        validAllocations: validAllocations.toFixed(2),
      });
      throw new ApiError(
        422,
        `Inconsistent feed payment state on ${sale.id}: paid amount is less than settlement allocations`,
        { code: 'FEED_INCONSISTENT_PAID_AMOUNT' }
      );
    }

    if (!amountPaid.plus(pending).equals(original)) {
      logger.error('Feed reconciliation failed: amountPaid + pendingAmount != totalAmount', {
        foodSaleId: sale.id,
        original: original.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        pending: pending.toFixed(2),
      });
      throw new ApiError(
        422,
        `Feed reconciliation mismatch on ${sale.id}: paid + pending does not equal original sale amount`,
        { code: 'FEED_RECONCILIATION_MISMATCH' }
      );
    }

    const validExternalPayments = amountPaid.minus(validAllocations);

    return {
      originalAmount: original,
      validExternalPayments,
      validSettlementAllocations: validAllocations,
      remainingBalance: pending,
    };
  }

  public static reconcileFeedSales(sales: ReconcilableFeedSale[]): void {
    for (const sale of sales) {
      this.reconcileFeedSale(sale);
    }
  }

  public static reconcileAdvance(advance: ReconcilableAdvance): {
    originalAmount: Decimal;
    validExternalRepayments: Decimal;
    validSettlementDeductions: Decimal;
    remainingBalance: Decimal;
  } {
    const original = toMoney(advance.originalAmount);
    const recovered = toMoney(advance.recoveredAmount);
    const pending = toMoney(advance.pendingAmount);

    if (original.isNegative() || recovered.isNegative() || pending.isNegative()) {
      logger.error('Advance reconciliation failed: negative balance detected', {
        advanceId: advance.id,
        original: original.toFixed(2),
        recovered: recovered.toFixed(2),
        pending: pending.toFixed(2),
      });
      throw new ApiError(422, `Negative balance detected on advance ${advance.id}`, {
        code: 'ADVANCE_NEGATIVE_BALANCE',
      });
    }

    const seenSettlementAllocs = new Set<string>();
    let validSettlementAllocations = new MoneyDecimal(0);

    for (const alloc of advance.settlementAllocations) {
      if (alloc.settlement?.status === 'CANCELLED') {
        continue;
      }
      if (seenSettlementAllocs.has(alloc.settlementId)) {
        logger.error('Advance reconciliation failed: duplicate settlement allocation', {
          advanceId: advance.id,
          settlementId: alloc.settlementId,
        });
        throw new ApiError(
          422,
          `Duplicate settlement allocation detected for advance ${advance.id}`,
          { code: 'ADVANCE_DUPLICATE_ALLOCATION' }
        );
      }
      seenSettlementAllocs.add(alloc.settlementId);
      validSettlementAllocations = validSettlementAllocations.plus(
        toMoney(alloc.allocatedAmount)
      );
    }

    let validExternalRepayments = new MoneyDecimal(0);
    let validSettlementTxRecoveries = new MoneyDecimal(0);
    const seenRecoverySettlementIds = new Set<string>();

    for (const tx of advance.transactions) {
      const amt = toMoney(tx.amount);
      if (tx.type === 'MANUAL_REPAYMENT') {
        validExternalRepayments = validExternalRepayments.plus(amt);
      } else if (tx.type === 'BILL_SETTLEMENT_RECOVERY') {
        if (!tx.settlementId) {
          logger.error('Advance reconciliation failed: settlement recovery missing settlementId', {
            advanceId: advance.id,
            transactionId: tx.id,
          });
          throw new ApiError(
            422,
            `Advance settlement recovery transaction ${tx.id} is missing settlement reference`,
            { code: 'ADVANCE_MISSING_SETTLEMENT_REF' }
          );
        }
        if (tx.settlement?.status === 'CANCELLED') {
          continue;
        }
        if (seenRecoverySettlementIds.has(tx.settlementId)) {
          logger.error('Advance reconciliation failed: duplicate BILL_SETTLEMENT_RECOVERY', {
            advanceId: advance.id,
            settlementId: tx.settlementId,
          });
          throw new ApiError(
            422,
            `Duplicate settlement recovery transaction detected for advance ${advance.id}`,
            { code: 'ADVANCE_DUPLICATE_RECOVERY' }
          );
        }
        seenRecoverySettlementIds.add(tx.settlementId);
        validSettlementTxRecoveries = validSettlementTxRecoveries.plus(amt);
      }
    }

    if (!validSettlementTxRecoveries.equals(validSettlementAllocations)) {
      logger.error('Advance reconciliation failed: recovery transactions != settlement allocations', {
        advanceId: advance.id,
        validSettlementTxRecoveries: validSettlementTxRecoveries.toFixed(2),
        validSettlementAllocations: validSettlementAllocations.toFixed(2),
      });
      throw new ApiError(
        422,
        `Advance recovery mismatch on ${advance.id}: settlement transactions do not match allocations`,
        { code: 'ADVANCE_SETTLEMENT_RECOVERY_MISMATCH' }
      );
    }

    const totalValidRecovered = validExternalRepayments.plus(validSettlementAllocations);

    if (totalValidRecovered.greaterThan(original)) {
      logger.error('Advance reconciliation failed: recoveries exceed original amount', {
        advanceId: advance.id,
        original: original.toFixed(2),
        totalValidRecovered: totalValidRecovered.toFixed(2),
      });
      throw new ApiError(
        422,
        `Advance recoveries exceed original amount on ${advance.id}`,
        { code: 'ADVANCE_ALLOCATION_EXCEEDS_ORIGINAL' }
      );
    }

    if (!totalValidRecovered.equals(recovered)) {
      logger.error('Advance reconciliation failed: recoveredAmount != external + settlement', {
        advanceId: advance.id,
        recovered: recovered.toFixed(2),
        totalValidRecovered: totalValidRecovered.toFixed(2),
      });
      throw new ApiError(
        422,
        `Advance recoveredAmount mismatch on ${advance.id}`,
        { code: 'ADVANCE_RECOVERED_MISMATCH' }
      );
    }

    if (!recovered.plus(pending).equals(original)) {
      logger.error('Advance reconciliation failed: recovered + pending != original', {
        advanceId: advance.id,
        original: original.toFixed(2),
        recovered: recovered.toFixed(2),
        pending: pending.toFixed(2),
      });
      throw new ApiError(
        422,
        `Advance reconciliation mismatch on ${advance.id}: recovered + pending does not equal original`,
        { code: 'ADVANCE_RECONCILIATION_MISMATCH' }
      );
    }

    return {
      originalAmount: original,
      validExternalRepayments,
      validSettlementDeductions: validSettlementAllocations,
      remainingBalance: pending,
    };
  }

  public static reconcileAdvances(advances: ReconcilableAdvance[]): void {
    for (const adv of advances) {
      this.reconcileAdvance(adv);
    }
  }

  public static reconcileSettlement(
    settlement: ReconcilableSettlementSnapshot
  ): SettlementReconciliationReport {
    const discrepancies: SettlementDiscrepancy[] = [];
    const push = (
      code: string,
      scope: SettlementDiscrepancy['scope'],
      message: string,
      details?: Record<string, string>
    ) => {
      discrepancies.push({
        code,
        scope,
        message,
        farmerId: settlement.customerId,
        settlementNumber: settlement.settlementNumber,
        details,
      });
    };

    const gross = toMoney(settlement.grossMilkAmount);
    const prevFeed = toMoney(settlement.previousFeedPending);
    const feedDed = toMoney(settlement.feedDeductionAmount);
    const remFeed = toMoney(settlement.remainingFeedBalance);
    const prevAdv = toMoney(settlement.previousAdvancePending);
    const advDed = toMoney(settlement.advanceDeductionAmount);
    const remAdv = toMoney(settlement.remainingAdvanceBalance);
    const netPayable = toMoney(settlement.netPayableAmount);

    // 1. Non-negative balance checks
    if (
      gross.isNegative() ||
      feedDed.isNegative() ||
      advDed.isNegative() ||
      netPayable.isNegative()
    ) {
      push('SETTLEMENT_NEGATIVE_AMOUNT', 'SETTLEMENT', 'Negative settlement monetary amount detected');
    }
    if (remFeed.isNegative()) {
      push('NEGATIVE_REMAINING_FEED', 'FEED', 'Remaining feed balance cannot be negative', {
        remainingFeedBalance: remFeed.toFixed(2),
      });
    }
    if (remAdv.isNegative()) {
      push('NEGATIVE_REMAINING_ADVANCE', 'ADVANCE', 'Remaining advance balance cannot be negative', {
        remainingAdvanceBalance: remAdv.toFixed(2),
      });
    }

    // 2. Milk settlement equation: MilkAmount = FeedDeducted + AdvanceDeducted + NetPayable
    const reconstructedGross = feedDed.plus(advDed).plus(netPayable);
    if (!reconstructedGross.equals(gross)) {
      push(
        'SETTLEMENT_EQUATION_MISMATCH',
        'SETTLEMENT',
        'Gross milk amount does not equal feedDeducted + advanceDeducted + netPayable',
        {
          gross: gross.toFixed(2),
          reconstructed: reconstructedGross.toFixed(2),
        }
      );
    }

    // 3. Milk snapshot entries vs grossMilkAmount
    if (settlement.milkEntries) {
      let milkSum = new MoneyDecimal(0);
      const seenMilkIds = new Set<string>();
      for (const m of settlement.milkEntries) {
        if (seenMilkIds.has(m.milkEntryId)) {
          push('DUPLICATE_MILK_ALLOCATION', 'MILK', `Duplicate milk allocation for ${m.milkEntryId}`);
        }
        seenMilkIds.add(m.milkEntryId);
        milkSum = milkSum.plus(toMoney(m.totalAmount));
      }
      if (!milkSum.equals(gross)) {
        push('MILK_SNAPSHOT_TOTAL_MISMATCH', 'MILK', 'Sum of SettlementMilkEntry does not match grossMilkAmount', {
          milkSum: milkSum.toFixed(2),
          gross: gross.toFixed(2),
        });
      }
    }

    // 4. Feed allocation reconciliation
    let feedAllocSum = new MoneyDecimal(0);
    const seenFeedIds = new Set<string>();
    for (const fa of settlement.feedAllocations) {
      if (seenFeedIds.has(fa.foodSaleId)) {
        push('DUPLICATE_FEED_ALLOCATION', 'FEED', `Duplicate feed allocation for ${fa.foodSaleId}`);
      }
      seenFeedIds.add(fa.foodSaleId);

      const faPrev = toMoney(fa.previousPendingAmount);
      const faAlloc = toMoney(fa.allocatedAmount);
      const faRem = toMoney(fa.remainingPendingAmount);
      if (faRem.isNegative()) {
        push('NEGATIVE_REMAINING_FEED', 'FEED', `Negative remainingPendingAmount on feed sale ${fa.foodSaleId}`);
      }
      if (faAlloc.greaterThan(faPrev)) {
        push('FEED_OVER_ALLOCATION', 'FEED', `Feed allocation exceeds previousPendingAmount on ${fa.foodSaleId}`);
      }
      if (!faPrev.minus(faAlloc).equals(faRem)) {
        push('FEED_ALLOCATION_MATH_MISMATCH', 'FEED', `Feed allocation math mismatch on ${fa.foodSaleId}`);
      }
      feedAllocSum = feedAllocSum.plus(faAlloc);
    }

    if (!feedAllocSum.equals(feedDed)) {
      push(
        feedAllocSum.lessThan(feedDed) ? 'MISSING_FEED_ALLOCATION' : 'FEED_OVER_ALLOCATION',
        'FEED',
        'Sum of SettlementFeedAllocation does not match settlement feedDeductionAmount',
        { feedAllocSum: feedAllocSum.toFixed(2), feedDed: feedDed.toFixed(2) }
      );
    }
    if (!prevFeed.minus(feedDed).equals(remFeed)) {
      push('FEED_CARRY_FORWARD_MISMATCH', 'FEED', 'Feed carry-forward balance does not match previousFeedPending - feedDeducted', {
        expected: prevFeed.minus(feedDed).toFixed(2),
        actual: remFeed.toFixed(2),
      });
    }

    // 5. Advance allocation reconciliation
    let advAllocSum = new MoneyDecimal(0);
    const seenAdvIds = new Set<string>();
    for (const aa of settlement.advanceAllocations) {
      if (seenAdvIds.has(aa.advanceId)) {
        push('DUPLICATE_ADVANCE_ALLOCATION', 'ADVANCE', `Duplicate advance allocation for ${aa.advanceId}`);
      }
      seenAdvIds.add(aa.advanceId);

      const aaPrev = toMoney(aa.previousPendingAmount);
      const aaAlloc = toMoney(aa.allocatedAmount);
      const aaRem = toMoney(aa.remainingPendingAmount);
      if (aaRem.isNegative()) {
        push('NEGATIVE_REMAINING_ADVANCE', 'ADVANCE', `Negative remainingPendingAmount on advance ${aa.advanceId}`);
      }
      if (aaAlloc.greaterThan(aaPrev)) {
        push('ADVANCE_OVER_ALLOCATION', 'ADVANCE', `Advance allocation exceeds previousPendingAmount on ${aa.advanceId}`);
      }
      if (!aaPrev.minus(aaAlloc).equals(aaRem)) {
        push('ADVANCE_ALLOCATION_MATH_MISMATCH', 'ADVANCE', `Advance allocation math mismatch on ${aa.advanceId}`);
      }
      advAllocSum = advAllocSum.plus(aaAlloc);
    }

    if (!advAllocSum.equals(advDed)) {
      push(
        advAllocSum.lessThan(advDed) ? 'MISSING_ADVANCE_ALLOCATION' : 'ADVANCE_OVER_ALLOCATION',
        'ADVANCE',
        'Sum of SettlementAdvanceAllocation does not match settlement advanceDeductionAmount',
        { advAllocSum: advAllocSum.toFixed(2), advDed: advDed.toFixed(2) }
      );
    }
    if (!prevAdv.minus(advDed).equals(remAdv)) {
      push('ADVANCE_CARRY_FORWARD_MISMATCH', 'ADVANCE', 'Advance carry-forward balance does not match previousAdvancePending - advanceDeducted', {
        expected: prevAdv.minus(advDed).toFixed(2),
        actual: remAdv.toFixed(2),
      });
    }

    // 6. Ledger vs Settlement snapshot reconciliation
    if (!settlement.ledgerEntry) {
      push('LEDGER_ENTRY_MISSING', 'LEDGER', 'SettlementLedgerEntry is missing for settlement');
    } else {
      const l = settlement.ledgerEntry;
      const expectedTotalDed = feedDed.plus(advDed);
      if (
        !toMoney(l.grossMilkAmount).equals(gross) ||
        !toMoney(l.totalDeductions).equals(expectedTotalDed) ||
        !toMoney(l.netPayableAmount).equals(netPayable) ||
        !toMoney(l.remainingFeedBalance).equals(remFeed) ||
        !toMoney(l.remainingAdvanceBalance).equals(remAdv)
      ) {
        push('LEDGER_SNAPSHOT_MISMATCH', 'LEDGER', 'SettlementLedgerEntry values do not match BillSettlement snapshot');
      }
    }

    if (discrepancies.length > 0) {
      logger.warn('Settlement reconciliation detected discrepancies', {
        settlementId: settlement.id,
        settlementNumber: settlement.settlementNumber,
        farmerId: settlement.customerId,
        count: discrepancies.length,
        codes: discrepancies.map((d) => d.code),
      });
    }

    return {
      isReconciled: discrepancies.length === 0,
      settlementId: settlement.id,
      settlementNumber: settlement.settlementNumber,
      farmerId: settlement.customerId,
      discrepancies,
    };
  }
}

export interface SettlementDiscrepancy {
  code: string;
  scope: 'MILK' | 'FEED' | 'ADVANCE' | 'LEDGER' | 'SETTLEMENT';
  message: string;
  farmerId: string;
  settlementNumber: string;
  details?: Record<string, string>;
}

export interface SettlementReconciliationReport {
  isReconciled: boolean;
  settlementId: string;
  settlementNumber: string;
  farmerId: string;
  discrepancies: SettlementDiscrepancy[];
}

export interface ReconcilableSettlementSnapshot {
  id: string;
  settlementNumber: string;
  customerId: string;
  grossMilkAmount: number | string | Decimal;
  previousFeedPending: number | string | Decimal;
  feedDeductionAmount: number | string | Decimal;
  remainingFeedBalance: number | string | Decimal;
  previousAdvancePending: number | string | Decimal;
  advanceDeductionAmount: number | string | Decimal;
  remainingAdvanceBalance: number | string | Decimal;
  netPayableAmount: number | string | Decimal;
  milkEntries?: Array<{
    milkEntryId: string;
    totalAmount: number | string | Decimal;
  }>;
  feedAllocations: Array<{
    foodSaleId: string;
    previousPendingAmount: number | string | Decimal;
    allocatedAmount: number | string | Decimal;
    remainingPendingAmount: number | string | Decimal;
  }>;
  advanceAllocations: Array<{
    advanceId: string;
    previousPendingAmount: number | string | Decimal;
    allocatedAmount: number | string | Decimal;
    remainingPendingAmount: number | string | Decimal;
  }>;
  ledgerEntry?: {
    grossMilkAmount: number | string | Decimal;
    totalDeductions: number | string | Decimal;
    netPayableAmount: number | string | Decimal;
    remainingFeedBalance: number | string | Decimal;
    remainingAdvanceBalance: number | string | Decimal;
  } | null;
}

