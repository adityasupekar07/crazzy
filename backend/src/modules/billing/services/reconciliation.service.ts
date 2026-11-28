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
}

