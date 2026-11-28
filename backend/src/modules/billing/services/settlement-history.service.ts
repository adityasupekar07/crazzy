import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../../db/index.js';
import ApiError from '../../../utils/ApiError.js';
import { formatIstDate, getIstStartOfDay, getIstEndOfDay } from '../../rateChart/utils/dateUtils.js';
import { BillingCycleService } from './billing-cycle.service.js';
import {
  PaginatedSettlementListDto,
  SettlementDetailDto,
  SettlementListQueryDto,
} from '../dto/settlement.dto.js';

const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function formatMoney(value: Decimal.Value): string {
  return new MoneyDecimal(value.toString())
    .toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP)
    .toFixed(2);
}

/**
 * Strictly read-only service for querying finalized/cancelled settlement history
 * and historical settlement snapshots.
 */
export class SettlementHistoryService {
  public static async listSettlements(
    adminId: string,
    query: SettlementListQueryDto
  ): Promise<PaginatedSettlementListDto> {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const skip = (page - 1) * limit;

    const where: Prisma.BillSettlementWhereInput = {
      adminId,
    };

    if (query.farmerId) {
      where.customerId = query.farmerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.settlementReference) {
      where.settlementNumber = {
        contains: query.settlementReference,
        mode: 'insensitive',
      };
    }

    if (query.startDate && query.endDate) {
      const validated = BillingCycleService.validateCycleDates(query.startDate, query.endDate, {
        allowFuturePeriods: true,
      });
      const istStart = getIstStartOfDay(new Date(validated.startDate));
      const istEnd = getIstEndOfDay(new Date(validated.endDate));
      where.cycleStartDate = { gte: istStart };
      where.cycleEndDate = { lte: istEnd };
    } else if (query.startDate) {
      const validated = BillingCycleService.validateCycleDates(query.startDate, query.startDate, {
        allowFuturePeriods: true,
      });
      where.cycleStartDate = { gte: getIstStartOfDay(new Date(validated.startDate)) };
    } else if (query.endDate) {
      const validated = BillingCycleService.validateCycleDates(query.endDate, query.endDate, {
        allowFuturePeriods: true,
      });
      where.cycleEndDate = { lte: getIstEndOfDay(new Date(validated.endDate)) };
    }

    const [total, rows] = await Promise.all([
      prisma.billSettlement.count({ where }),
      prisma.billSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ settledAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const data = rows.map((row) => {
      const totalDeductionsDec = new MoneyDecimal(row.feedDeductionAmount.toString()).plus(
        new MoneyDecimal(row.advanceDeductionAmount.toString())
      );

      return {
        id: row.id,
        settlementNumber: row.settlementNumber,
        farmer: {
          id: row.customer.id,
          code: row.customer.code,
          name: row.customer.name,
        },
        billingPeriod: {
          startDate: formatIstDate(row.cycleStartDate),
          endDate: formatIstDate(row.cycleEndDate),
        },
        milkAmount: formatMoney(row.grossMilkAmount.toString()),
        totalDeductions: formatMoney(totalDeductionsDec),
        netPayable: formatMoney(row.netPayableAmount.toString()),
        status: row.status,
        finalizedAt: row.settledAt.toISOString(),
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
      },
    };
  }

  public static async getSettlementDetail(
    adminId: string,
    settlementId: string
  ): Promise<SettlementDetailDto> {
    const settlement = await prisma.billSettlement.findFirst({
      where: {
        id: settlementId,
        adminId,
      },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            mobile: true,
          },
        },
        milkEntries: {
          orderBy: [{ collectionDate: 'asc' }, { shift: 'asc' }],
        },
        feedAllocations: {
          include: {
            foodSale: {
              select: {
                id: true,
                foodName: true,
                saleDate: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        advanceAllocations: {
          include: {
            advance: {
              select: {
                id: true,
                advanceNumber: true,
                givenDate: true,
                transactions: {
                  where: { type: 'MANUAL_REPAYMENT' },
                  select: {
                    amount: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!settlement) {
      throw new ApiError(404, 'Settlement not found or access denied');
    }

    let previousFeedOutstandingDec = new MoneyDecimal(0);
    let currentFeedSalesDec = new MoneyDecimal(0);

    const feedAllocations = settlement.feedAllocations.map((alloc) => {
      const originalDec = new MoneyDecimal(alloc.originalSaleAmount.toString());
      const prevPendingDec = new MoneyDecimal(alloc.previousPendingAmount.toString());
      const prevPaymentsDec = MoneyDecimal.max(0, originalDec.minus(prevPendingDec));

      if (alloc.foodSale.saleDate < settlement.cycleStartDate) {
        previousFeedOutstandingDec = previousFeedOutstandingDec.plus(prevPendingDec);
      } else {
        currentFeedSalesDec = currentFeedSalesDec.plus(prevPendingDec);
      }

      return {
        id: alloc.id,
        foodSaleId: alloc.foodSaleId,
        foodName: alloc.foodSale.foodName,
        saleDate: formatIstDate(alloc.foodSale.saleDate),
        originalAmount: formatMoney(originalDec),
        previousPayments: formatMoney(prevPaymentsDec),
        previousPending: formatMoney(prevPendingDec),
        deductedAmount: formatMoney(alloc.allocatedAmount.toString()),
        remainingAmount: formatMoney(alloc.remainingPendingAmount.toString()),
      };
    });

    const totalFeedOutstandingDec = new MoneyDecimal(settlement.previousFeedPending.toString());
    // If feed allocations didn't cover unallocated sales (e.g., 0 milk), attribute remainder to previous outstanding
    const allocatedFeedPrevTotal = previousFeedOutstandingDec.plus(currentFeedSalesDec);
    if (totalFeedOutstandingDec.greaterThan(allocatedFeedPrevTotal)) {
      previousFeedOutstandingDec = previousFeedOutstandingDec.plus(
        totalFeedOutstandingDec.minus(allocatedFeedPrevTotal)
      );
    }

    const advanceAllocations = settlement.advanceAllocations.map((alloc) => {
      const externalRepaymentsDec = alloc.advance.transactions
        .filter((tx) => tx.createdAt <= settlement.settledAt)
        .reduce(
          (sum, tx) => sum.plus(new MoneyDecimal(tx.amount.toString())),
          new MoneyDecimal(0)
        );

      return {
        id: alloc.id,
        advanceId: alloc.advanceId,
        advanceNumber: alloc.advance.advanceNumber,
        givenDate: formatIstDate(alloc.advance.givenDate),
        originalAmount: formatMoney(alloc.originalAdvanceAmount.toString()),
        externalRepayments: formatMoney(externalRepaymentsDec),
        previousPending: formatMoney(alloc.previousPendingAmount.toString()),
        deductedAmount: formatMoney(alloc.allocatedAmount.toString()),
        remainingAmount: formatMoney(alloc.remainingPendingAmount.toString()),
      };
    });

    const milkCollections = settlement.milkEntries.map((m) => ({
      id: m.id,
      milkEntryId: m.milkEntryId,
      date: formatIstDate(m.collectionDate),
      shift: m.shift,
      milkType: m.milkType,
      litres: formatMoney(m.quantity.toString()),
      fat: formatMoney((m.fat ?? 0).toString()),
      snf: formatMoney((m.snf ?? 0).toString()),
      rate: formatMoney(m.rate.toString()),
      amount: formatMoney(m.totalAmount.toString()),
    }));

    const totalDeductionsDec = new MoneyDecimal(settlement.feedDeductionAmount.toString()).plus(
      new MoneyDecimal(settlement.advanceDeductionAmount.toString())
    );

    return {
      settlementId: settlement.id,
      settlementNumber: settlement.settlementNumber,
      status: settlement.status,
      finalizedAt: settlement.settledAt.toISOString(),
      finalizedBy: settlement.settledBy ?? null,
      farmer: {
        id: settlement.customer.id,
        code: settlement.customer.code,
        name: settlement.customer.name,
        mobile: settlement.customer.mobile,
      },
      billingPeriod: {
        startDate: formatIstDate(settlement.cycleStartDate),
        endDate: formatIstDate(settlement.cycleEndDate),
        cycleType: settlement.paymentPeriod ?? 'CUSTOM',
      },
      milkCollections,
      feedAllocations,
      advanceAllocations,
      summary: {
        totalLitres: formatMoney(settlement.totalLitres.toString()),
        grossMilkAmount: formatMoney(settlement.grossMilkAmount.toString()),
        previousFeedOutstanding: formatMoney(previousFeedOutstandingDec),
        currentFeedSales: formatMoney(currentFeedSalesDec),
        totalFeedOutstanding: formatMoney(totalFeedOutstandingDec),
        feedDeducted: formatMoney(settlement.feedDeductionAmount.toString()),
        remainingFeed: formatMoney(settlement.remainingFeedBalance.toString()),
        totalAdvanceOutstanding: formatMoney(settlement.previousAdvancePending.toString()),
        advanceDeducted: formatMoney(settlement.advanceDeductionAmount.toString()),
        remainingAdvance: formatMoney(settlement.remainingAdvanceBalance.toString()),
        totalDeductions: formatMoney(totalDeductionsDec),
        netPayable: formatMoney(settlement.netPayableAmount.toString()),
      },
    };
  }
}

