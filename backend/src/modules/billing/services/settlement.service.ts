import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../../db/index.js';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';
import { formatIstDate, getIstStartOfDay, getIstEndOfDay } from '../../rateChart/utils/dateUtils.js';
import { BillingRepository } from '../repositories/billing.repository.js';
import { AdvanceRepository } from '../repositories/advance.repository.js';
import { FeedRepository } from '../repositories/feed.repository.js';
import { BillingCycleService } from './billing-cycle.service.js';
import { ReconciliationService } from './reconciliation.service.js';
import {
  BillingCalculationService,
  calculateBillingSettlement,
} from './billing-calculation.service.js';
import { SettlementValidationService } from './settlement-validation.service.js';
import {
  CreateSettlementRequestDto,
  FinalizeSettlementRequestDto,
  FinalizeSettlementResponseDto,
  SettlementResponseDto,
} from '../dto/settlement.dto.js';
import { SettlementRecord } from '../types/billing.types.js';

const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function formatMoney(value: Decimal): string {
  return value.toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP).toFixed(2);
}

export interface SettlementTransactionHooks {
  onBeforeFeedAllocation?: () => void;
  onBeforeAdvanceAllocation?: () => void;
  onBeforeLedger?: () => void;
  onBeforeAuditLog?: () => void;
}

const MAX_SERIALIZATION_RETRIES = 3;

function isTransientSerializationError(err: any): boolean {
  if (!err) return false;
  if (err.code === 'P2034') return true;
  const pgCode = err?.meta?.code || err?.cause?.code;
  if (pgCode === '40001' || pgCode === '40P01') return true;
  const msg = String(err.message || '');
  return (
    msg.includes('could not serialize access') ||
    msg.includes('deadlock detected') ||
    msg.includes('Transaction failed due to a write conflict')
  );
}

function isOverlappingConstraintError(err: any): boolean {
  if (!err) return false;
  const pgCode = err?.meta?.code || err?.cause?.code;
  const msg = String(err.message || '');
  return (
    pgCode === '23P01' ||
    msg.includes('bill_settlements_no_overlapping_finalized_period')
  );
}

/**
 * Finalizes and persists farmer bill settlements.
 */
export class SettlementService {
  /**
   * Phase 9: Atomic, Serializable, Idempotent Settlement Finalization.
   */
  public static async finalizeSettlement(
    adminId: string,
    performedBy: string | undefined,
    dto: FinalizeSettlementRequestDto,
    hooks?: SettlementTransactionHooks
  ): Promise<FinalizeSettlementResponseDto> {
    const requestHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          previewId: dto.previewId,
          farmerId: dto.farmerId,
          startDate: dto.startDate,
          endDate: dto.endDate,
        })
      )
      .digest('hex');

    // Pre-transaction idempotency fast check
    const existingIdem = await prisma.billingIdempotencyKey.findUnique({
      where: {
        adminId_idempotencyKey: {
          adminId,
          idempotencyKey: dto.idempotencyKey,
        },
      },
    });

    if (existingIdem) {
      if (existingIdem.requestHash !== requestHash) {
        throw new ApiError(
          409,
          'Idempotency key has already been used with different settlement parameters',
          { code: 'IDEMPOTENCY_CONFLICT' }
        );
      }
      if (existingIdem.responseSnapshot) {
        return existingIdem.responseSnapshot as unknown as FinalizeSettlementResponseDto;
      }
    }

    let attempt = 0;
    while (attempt <= MAX_SERIALIZATION_RETRIES) {
      try {
        return await this.executeFinalizeTransaction(
          adminId,
          performedBy,
          dto,
          requestHash,
          hooks
        );
      } catch (err: any) {
        if (err instanceof ApiError) {
          throw err;
        }

        // Check if a concurrent duplicate with the same idempotencyKey committed first
        if (err?.code === 'P2002') {
          const target = String(err?.meta?.target || '');
          if (target.includes('idempotencyKey') || target.includes('adminId_idempotencyKey')) {
            const raceIdem = await prisma.billingIdempotencyKey.findUnique({
              where: {
                adminId_idempotencyKey: { adminId, idempotencyKey: dto.idempotencyKey },
              },
            });
            if (raceIdem) {
              if (raceIdem.requestHash !== requestHash) {
                throw new ApiError(
                  409,
                  'Idempotency key has already been used with different settlement parameters',
                  { code: 'IDEMPOTENCY_CONFLICT' }
                );
              }
              if (raceIdem.responseSnapshot) {
                return raceIdem.responseSnapshot as unknown as FinalizeSettlementResponseDto;
              }
            }
          }
          if (target.includes('milkEntryId')) {
            throw new ApiError(409, 'One or more milk collections are already settled', {
              code: 'MILK_ALREADY_SETTLED',
            });
          }
        }

        if (isOverlappingConstraintError(err)) {
          throw new ApiError(
            409,
            'An overlapping finalized settlement already exists for this farmer and period',
            { code: 'OVERLAPPING_SETTLEMENT' }
          );
        }

        if (isTransientSerializationError(err) && attempt < MAX_SERIALIZATION_RETRIES) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, 25 * attempt));
          continue;
        }

        if (isTransientSerializationError(err)) {
          throw new ApiError(
            409,
            'Concurrent settlement serialization conflict after retries. Please retry.',
            { code: 'SERIALIZATION_CONFLICT' }
          );
        }

        throw err;
      }
    }

    throw new ApiError(409, 'Settlement failed due to concurrency conflict', {
      code: 'SERIALIZATION_CONFLICT',
    });
  }

  private static async executeFinalizeTransaction(
    adminId: string,
    performedBy: string | undefined,
    dto: FinalizeSettlementRequestDto,
    requestHash: string,
    hooks?: SettlementTransactionHooks
  ): Promise<FinalizeSettlementResponseDto> {
    return prisma.$transaction(
      async (tx) => {
        // 1. Farmer-level financial scope lock (advisory lock + row lock)
        const lockKey = `${adminId}:${dto.farmerId}`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const lockedCustomers = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Customer"
          WHERE id = ${dto.farmerId} AND "adminId" = ${adminId}
          FOR UPDATE
        `;

        if (!lockedCustomers || lockedCustomers.length === 0) {
          throw new ApiError(404, 'Farmer not found or access denied');
        }

        // 2. Re-check idempotency inside transaction under lock
        const txIdem = await tx.billingIdempotencyKey.findUnique({
          where: {
            adminId_idempotencyKey: {
              adminId,
              idempotencyKey: dto.idempotencyKey,
            },
          },
        });
        if (txIdem) {
          if (txIdem.requestHash !== requestHash) {
            throw new ApiError(
              409,
              'Idempotency key has already been used with different settlement parameters',
              { code: 'IDEMPOTENCY_CONFLICT' }
            );
          }
          if (txIdem.responseSnapshot) {
            return txIdem.responseSnapshot as unknown as FinalizeSettlementResponseDto;
          }
        }

        // 3. Validate billing period according to dairy config
        const cycleConfig = BillingCycleService.getCycleConfig(adminId);
        const period = BillingCycleService.validateCycleDates(dto.startDate, dto.endDate, {
          allowFuturePeriods: cycleConfig.allowFuturePeriods,
        });
        const cycleStartDate = getIstStartOfDay(new Date(period.startDate));
        const cycleEndDate = getIstEndOfDay(new Date(period.endDate));

        // 4. Check overlapping finalized settlement
        const overlapping = await tx.billSettlement.findFirst({
          where: {
            adminId,
            customerId: dto.farmerId,
            status: 'FINALIZED',
            cycleStartDate: { lte: cycleEndDate },
            cycleEndDate: { gte: cycleStartDate },
          },
          select: { id: true, settlementNumber: true },
        });
        if (overlapping) {
          throw new ApiError(
            409,
            `Overlapping finalized settlement (${overlapping.settlementNumber}) already exists for this farmer and period`,
            { code: 'OVERLAPPING_SETTLEMENT' }
          );
        }

        // 5. Validate preview existence, ownership, and billing period
        const previewRecord = await tx.billingPreviewRecord.findUnique({
          where: { id: dto.previewId },
        });
        if (!previewRecord) {
          throw new ApiError(400, 'Invalid or unknown previewId', { code: 'INVALID_PREVIEW' });
        }
        if (previewRecord.adminId !== adminId || previewRecord.customerId !== dto.farmerId) {
          throw new ApiError(403, 'Preview does not belong to this dairy or farmer', {
            code: 'PREVIEW_OWNERSHIP_MISMATCH',
          });
        }
        if (
          previewRecord.startDate !== period.startDate ||
          previewRecord.endDate !== period.endDate
        ) {
          throw new ApiError(400, 'Preview billing period does not match settlement period', {
            code: 'PREVIEW_PERIOD_MISMATCH',
          });
        }

        // 6. Fetch current eligible milk collections, unsettled feed sales, and advances via tx
        const eligibleMilk = await tx.milkEntry.findMany({
          where: {
            customerId: dto.farmerId,
            customer: { adminId },
            isReversed: false,
            isSettled: false,
            date: { gte: cycleStartDate, lte: cycleEndDate },
            settlementEntry: { is: null },
          },
          orderBy: [{ date: 'asc' }, { shift: 'asc' }],
        });

        const feedSales = await tx.foodSale.findMany({
          where: {
            adminId,
            customerId: dto.farmerId,
            isActive: true,
            pendingAmount: { gt: 0 },
            saleDate: { lte: cycleEndDate },
          },
          include: {
            settlementAllocations: {
              select: {
                settlementId: true,
                allocatedAmount: true,
                settlement: { select: { status: true } },
              },
            },
          },
          orderBy: [{ saleDate: 'asc' }, { createdAt: 'asc' }],
        });

        const advances = await tx.advance.findMany({
          where: {
            adminId,
            customerId: dto.farmerId,
          },
          include: {
            settlementAllocations: {
              select: {
                settlementId: true,
                allocatedAmount: true,
                settlement: { select: { status: true } },
              },
            },
            transactions: {
              include: {
                settlement: { select: { status: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: [{ givenDate: 'asc' }, { createdAt: 'asc' }],
        });

        ReconciliationService.reconcileFeedSales(feedSales);
        ReconciliationService.reconcileAdvances(advances);

        // Reconstruct deterministic fingerprint matching BillingPreviewService
        const advanceItemsForFingerprint: Array<{
          id: string;
          advanceId: string;
          type: string;
          amount: string;
          remainingBalance: string;
          date: string;
          advanceNumber: string;
        }> = [];
        let totalAdvancePendingDec = new MoneyDecimal(0);

        for (const adv of advances) {
          totalAdvancePendingDec = totalAdvancePendingDec.plus(
            new MoneyDecimal(adv.pendingAmount.toString())
          );
          let running = new MoneyDecimal(0);
          for (const advTx of adv.transactions) {
            if (
              advTx.type === 'BILL_SETTLEMENT_RECOVERY' &&
              advTx.settlement?.status === 'CANCELLED'
            ) {
              continue;
            }
            const txAmt = new MoneyDecimal(advTx.amount.toString()).toDecimalPlaces(
              2,
              MoneyDecimal.ROUND_HALF_UP
            );
            if (advTx.type === 'ISSUED') {
              running = running.plus(txAmt);
            } else {
              running = MoneyDecimal.max(0, running.minus(txAmt));
            }
            const txDate = advTx.type === 'ISSUED' ? adv.givenDate : advTx.createdAt;
            advanceItemsForFingerprint.push({
              id: advTx.id,
              advanceId: adv.id,
              type: advTx.type,
              amount: formatMoney(txAmt),
              remainingBalance: formatMoney(running),
              date: formatIstDate(txDate),
              advanceNumber: adv.advanceNumber,
            });
          }
        }
        advanceItemsForFingerprint.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.advanceNumber.localeCompare(b.advanceNumber);
        });

        const currentFingerprintSource = {
          adminId,
          farmerId: dto.farmerId,
          startDate: period.startDate,
          endDate: period.endDate,
          milk: eligibleMilk.map((m) => ({
            id: m.id,
            litres: formatMoney(new MoneyDecimal(m.quantity.toString())),
            amount: formatMoney(new MoneyDecimal((m.totalAmount ?? 0).toString())),
          })),
          feed: feedSales.map((f) => ({
            id: f.id,
            remainingOutstanding: formatMoney(new MoneyDecimal(f.pendingAmount.toString())),
          })),
          advance: {
            totalAdvanceOutstanding: formatMoney(totalAdvancePendingDec),
            transactions: advanceItemsForFingerprint.map((a) => ({
              id: a.id,
              advanceId: a.advanceId,
              type: a.type,
              amount: a.amount,
              remainingBalance: a.remainingBalance,
            })),
          },
        };

        const currentFingerprint = crypto
          .createHash('sha256')
          .update(JSON.stringify(currentFingerprintSource))
          .digest('hex');

        if (currentFingerprint !== previewRecord.fingerprint) {
          throw new ApiError(
            409,
            'Preview is stale because underlying milk, feed, or advance balances have changed. Please generate a new preview.',
            { code: 'STALE_PREVIEW' }
          );
        }

        if (eligibleMilk.length === 0) {
          throw new ApiError(400, 'No eligible unsettled milk collections found for this period', {
            code: 'NO_ELIGIBLE_MILK',
          });
        }

        // 7. Recalculate independently using Decimal arithmetic + Phase 6 calculation engine
        let totalLitresDec = new MoneyDecimal(0);
        let totalMilkAmountDec = new MoneyDecimal(0);
        let weightedFatDec = new MoneyDecimal(0);
        let weightedSnfDec = new MoneyDecimal(0);

        for (const m of eligibleMilk) {
          const qty = new MoneyDecimal(m.quantity.toString());
          const amt = new MoneyDecimal((m.totalAmount ?? 0).toString());
          const fat = new MoneyDecimal((m.fat ?? 0).toString());
          const snf = new MoneyDecimal((m.snf ?? 0).toString());
          totalLitresDec = totalLitresDec.plus(qty);
          totalMilkAmountDec = totalMilkAmountDec.plus(amt);
          weightedFatDec = weightedFatDec.plus(qty.times(fat));
          weightedSnfDec = weightedSnfDec.plus(qty.times(snf));
        }

        const avgFatDec = totalLitresDec.greaterThan(0)
          ? weightedFatDec.dividedBy(totalLitresDec).toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP)
          : new MoneyDecimal(0);
        const avgSnfDec = totalLitresDec.greaterThan(0)
          ? weightedSnfDec.dividedBy(totalLitresDec).toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP)
          : new MoneyDecimal(0);

        let totalFeedPendingDec = new MoneyDecimal(0);
        for (const sale of feedSales) {
          totalFeedPendingDec = totalFeedPendingDec.plus(
            new MoneyDecimal(sale.pendingAmount.toString())
          );
        }

        const calc = calculateBillingSettlement({
          totalMilkAmount: formatMoney(totalMilkAmountDec),
          totalFeedOutstanding: formatMoney(totalFeedPendingDec),
          totalAdvanceOutstanding: formatMoney(totalAdvancePendingDec),
        });

        const feedDeductedDec = new MoneyDecimal(calc.feedDeducted);
        const remainingFeedDec = new MoneyDecimal(calc.remainingFeed);
        const advanceDeductedDec = new MoneyDecimal(calc.advanceDeducted);
        const remainingAdvanceDec = new MoneyDecimal(calc.remainingAdvance);
        const finalPayableDec = new MoneyDecimal(calc.finalPayable);
        const totalDeductionsDec = feedDeductedDec.plus(advanceDeductedDec);

        // 8. Create BillSettlement
        const settlementNumber = `SET-${Date.now().toString(36).toUpperCase()}-${crypto
          .randomBytes(2)
          .toString('hex')
          .toUpperCase()}`;

        const settlement = await tx.billSettlement.create({
          data: {
            settlementNumber,
            adminId,
            customerId: dto.farmerId,
            cycleStartDate,
            cycleEndDate,
            totalLitres: totalLitresDec.toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP).toFixed(2),
            avgFat: avgFatDec.toFixed(2),
            avgSnf: avgSnfDec.toFixed(2),
            grossMilkAmount: calc.totalMilkAmount,
            previousFeedPending: calc.totalFeedOutstanding,
            feedDeductionAmount: calc.feedDeducted,
            remainingFeedBalance: calc.remainingFeed,
            previousAdvancePending: calc.totalAdvanceOutstanding,
            advanceDeductionAmount: calc.advanceDeducted,
            remainingAdvanceBalance: calc.remainingAdvance,
            netPayableAmount: calc.finalPayable,
            status: 'FINALIZED',
            settledBy: performedBy ?? adminId,
          },
        });

        // 9. Create SettlementMilkEntry records & mark MilkEntry.isSettled = true
        await tx.settlementMilkEntry.createMany({
          data: eligibleMilk.map((m) => ({
            settlementId: settlement.id,
            milkEntryId: m.id,
            collectionDate: m.date,
            shift: m.shift,
            milkType: m.milkType,
            quantity: m.quantity,
            fat: m.fat,
            snf: m.snf,
            rate: m.rate ?? new Prisma.Decimal(0),
            totalAmount: m.totalAmount ?? new Prisma.Decimal(0),
          })),
        });

        const milkIds = eligibleMilk.map((m) => m.id);
        const updatedMilk = await tx.milkEntry.updateMany({
          where: { id: { in: milkIds }, isSettled: false },
          data: { isSettled: true },
        });
        if (updatedMilk.count !== milkIds.length) {
          throw new ApiError(409, 'One or more milk collections were settled concurrently', {
            code: 'MILK_ALREADY_SETTLED',
          });
        }

        // 10. Allocate Feed Deductions (FIFO) & update FoodSale
        hooks?.onBeforeFeedAllocation?.();
        let remainingFeedToAllocate = feedDeductedDec;
        for (const sale of feedSales) {
          if (remainingFeedToAllocate.lessThanOrEqualTo(0)) break;

          const prevPending = new MoneyDecimal(sale.pendingAmount.toString());
          if (prevPending.lessThanOrEqualTo(0)) continue;

          const alloc = MoneyDecimal.min(remainingFeedToAllocate, prevPending);
          const newPending = prevPending.minus(alloc);
          const newPaid = new MoneyDecimal(sale.amountPaid.toString()).plus(alloc);

          if (newPending.isNegative()) {
            throw new ApiError(500, 'Feed remaining balance cannot be negative');
          }

          await tx.settlementFeedAllocation.create({
            data: {
              settlementId: settlement.id,
              foodSaleId: sale.id,
              originalSaleAmount: sale.totalAmount,
              previousPendingAmount: formatMoney(prevPending),
              allocatedAmount: formatMoney(alloc),
              remainingPendingAmount: formatMoney(newPending),
            },
          });

          await tx.foodSale.update({
            where: { id: sale.id },
            data: {
              amountPaid: Number(formatMoney(newPaid)),
              pendingAmount: Number(formatMoney(newPending)),
            },
          });

          remainingFeedToAllocate = remainingFeedToAllocate.minus(alloc);
        }

        // 11. Allocate Advance Deductions (FIFO) & update Advance + AdvanceTransaction
        hooks?.onBeforeAdvanceAllocation?.();
        let remainingAdvanceToAllocate = advanceDeductedDec;
        for (const adv of advances) {
          if (remainingAdvanceToAllocate.lessThanOrEqualTo(0)) break;

          const prevPending = new MoneyDecimal(adv.pendingAmount.toString());
          if (prevPending.lessThanOrEqualTo(0)) continue;

          const alloc = MoneyDecimal.min(remainingAdvanceToAllocate, prevPending);
          const newPending = prevPending.minus(alloc);
          const newRecovered = new MoneyDecimal(adv.recoveredAmount.toString()).plus(alloc);
          const newStatus = newPending.equals(0) ? 'CLOSED' : 'PARTIALLY_RECOVERED';

          if (newPending.isNegative()) {
            throw new ApiError(500, 'Advance remaining balance cannot be negative');
          }

          await tx.settlementAdvanceAllocation.create({
            data: {
              settlementId: settlement.id,
              advanceId: adv.id,
              originalAdvanceAmount: adv.originalAmount,
              previousPendingAmount: formatMoney(prevPending),
              allocatedAmount: formatMoney(alloc),
              remainingPendingAmount: formatMoney(newPending),
            },
          });

          await tx.advance.update({
            where: { id: adv.id },
            data: {
              recoveredAmount: formatMoney(newRecovered),
              pendingAmount: formatMoney(newPending),
              status: newStatus,
            },
          });

          await tx.advanceTransaction.create({
            data: {
              advanceId: adv.id,
              settlementId: settlement.id,
              type: 'BILL_SETTLEMENT_RECOVERY',
              amount: formatMoney(alloc),
              notes: `Recovered in settlement ${settlement.settlementNumber} (${period.startDate} to ${period.endDate})`,
              createdBy: performedBy ?? adminId,
            },
          });

          remainingAdvanceToAllocate = remainingAdvanceToAllocate.minus(alloc);
        }

        // 12. Create SettlementLedgerEntry (non-duplicated net settlement ledger movement)
        hooks?.onBeforeLedger?.();
        await tx.settlementLedgerEntry.create({
          data: {
            settlementId: settlement.id,
            adminId,
            customerId: dto.farmerId,
            entryDate: settlement.settledAt,
            grossMilkAmount: calc.totalMilkAmount,
            totalDeductions: formatMoney(totalDeductionsDec),
            netPayableAmount: calc.finalPayable,
            remainingFeedBalance: formatMoney(remainingFeedDec),
            remainingAdvanceBalance: formatMoney(remainingAdvanceDec),
            notes: `Settlement ${settlement.settlementNumber} (${period.startDate} to ${period.endDate})`,
          },
        });

        // 13. Create SettlementAuditLog
        hooks?.onBeforeAuditLog?.();
        await tx.settlementAuditLog.create({
          data: {
            settlementId: settlement.id,
            adminId,
            customerId: dto.farmerId,
            performedBy: performedBy ?? adminId,
            cycleStartDate,
            cycleEndDate,
            grossMilkAmount: calc.totalMilkAmount,
            feedDeducted: calc.feedDeducted,
            advanceDeducted: calc.advanceDeducted,
            netPayable: formatMoney(finalPayableDec),
            action: 'FINALIZED',
            details: {
              previewId: dto.previewId,
              idempotencyKey: dto.idempotencyKey,
              milkEntryCount: eligibleMilk.length,
              settlementNumber: settlement.settlementNumber,
            },
          },
        });

        // 14. Build persisted response and store idempotency record
        const response: FinalizeSettlementResponseDto = {
          settlementId: settlement.id,
          settlementNumber: settlement.settlementNumber,
          status: settlement.status,
          farmerId: settlement.customerId,
          billingPeriod: {
            startDate: period.startDate,
            endDate: period.endDate,
          },
          milkSummary: {
            totalLitres: formatMoney(new MoneyDecimal(settlement.totalLitres.toString())),
            totalAmount: formatMoney(new MoneyDecimal(settlement.grossMilkAmount.toString())),
          },
          feedSummary: {
            totalOutstanding: formatMoney(
              new MoneyDecimal(settlement.previousFeedPending.toString())
            ),
            deducted: formatMoney(new MoneyDecimal(settlement.feedDeductionAmount.toString())),
            remaining: formatMoney(new MoneyDecimal(settlement.remainingFeedBalance.toString())),
          },
          advanceSummary: {
            totalOutstanding: formatMoney(
              new MoneyDecimal(settlement.previousAdvancePending.toString())
            ),
            deducted: formatMoney(new MoneyDecimal(settlement.advanceDeductionAmount.toString())),
            remaining: formatMoney(
              new MoneyDecimal(settlement.remainingAdvanceBalance.toString())
            ),
          },
          settlementSummary: {
            grossAmount: formatMoney(new MoneyDecimal(settlement.grossMilkAmount.toString())),
            totalDeductions: formatMoney(
              new MoneyDecimal(settlement.feedDeductionAmount.toString()).plus(
                new MoneyDecimal(settlement.advanceDeductionAmount.toString())
              )
            ),
            netPayable: formatMoney(new MoneyDecimal(settlement.netPayableAmount.toString())),
          },
          settledAt: settlement.settledAt.toISOString(),
        };

        await tx.billingIdempotencyKey.create({
          data: {
            adminId,
            idempotencyKey: dto.idempotencyKey,
            requestHash,
            settlementId: settlement.id,
            responseSnapshot: response as unknown as Prisma.InputJsonValue,
          },
        });

        return response;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }

  public static async createSettlement(
    adminId: string,
    payload: CreateSettlementRequestDto
  ): Promise<SettlementResponseDto> {
    const {
      customerId,
      startDate,
      endDate,
      totalAmount,
      advanceDeductionAmount = 0,
      feedDeductionAmount = 0,
      litres = 0,
      avgFat = 0,
      avgSnf = 0,
      milkEntryIds = [],
      remarks,
    } = payload;

    if (!customerId || !startDate || !endDate) {
      throw new ApiError(400, 'Customer ID, start date, and end date are required');
    }

    const customer = await BillingRepository.findCustomerForDairy(adminId, customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found or access denied');
    }

    const [activeAdvances, pendingSales] = await Promise.all([
      AdvanceRepository.findActiveAdvancesForFarmer(adminId, customerId),
      FeedRepository.findPendingSalesForFarmer(adminId, customerId),
    ]);

    const totalPendingAdvance = activeAdvances.reduce((sum, a) => sum + a.pendingAmount, 0);
    const totalPendingFeed = pendingSales.reduce((sum, s) => sum + s.pendingAmount, 0);

    const grossAmount = Math.max(0, Number(totalAmount) || 0);
    const requestedAdvance = Number(advanceDeductionAmount) || 0;
    const requestedFeed = Number(feedDeductionAmount) || 0;

    SettlementValidationService.validateDeductions({
      grossAmount,
      requestedFeedDeduction: requestedFeed,
      requestedAdvanceDeduction: requestedAdvance,
      totalPendingFeed,
      totalPendingAdvance,
    });

    const calculation = BillingCalculationService.calculate({
      grossMilkAmount: grossAmount,
      totalPendingFeed,
      totalPendingAdvance,
      requestedFeedDeduction: requestedFeed,
      requestedAdvanceDeduction: requestedAdvance,
    });

    const record: SettlementRecord = {
      id: `settle_${crypto.randomBytes(8).toString('hex')}`,
      adminId,
      customerId,
      customerName: customer.name,
      customerCode: customer.code,
      startDate,
      endDate,
      period: `${startDate} to ${endDate}`,
      litres: Number(litres) || 0,
      avgFat: Number(avgFat) || 0,
      avgSnf: Number(avgSnf) || 0,
      grossAmount: calculation.grossMilkAmount,
      feedDeductionAmount: calculation.feedDeductionAmount,
      advanceDeductionAmount: calculation.advanceDeductionAmount,
      netPayable: calculation.netPayable,
      milkEntryCount: milkEntryIds.length,
      milkEntryIds,
      remarks,
      createdAt: new Date().toISOString(),
    };

    await BillingRepository.saveSettlement(record);

    if (calculation.advanceDeductionAmount > 0) {
      await AdvanceRepository.applySettlementDeduction(
        adminId,
        activeAdvances,
        calculation.advanceDeductionAmount,
        `${startDate} to ${endDate}`
      );
    }

    logger.info(
      `Settlement created: ${record.id} for farmer ${customer.name} (Gross: ₹${calculation.grossMilkAmount}, Advance Deduction: ₹${calculation.advanceDeductionAmount}, Net: ₹${calculation.netPayable})`
    );

    return record;
  }

  public static async getBillingHistory(
    adminId: string,
    customerId?: string
  ): Promise<SettlementRecord[]> {
    return BillingRepository.findSettlementsByAdmin(adminId, customerId);
  }
}
