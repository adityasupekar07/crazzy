import prisma from '../../../db/index.js';
import { getIstStartOfDay, getIstEndOfDay, formatIstDate } from '../../rateChart/utils/dateUtils.js';
import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import { ReconciliationService } from '../services/reconciliation.service.js';
import { FarmerHistoryFeedItem, PendingFeedSaleItem } from '../types/billing.types.js';

export class FeedRepository {
  /**
   * Fetches unpaid previous-period and current-period feed sales for a farmer,
   * reflecting finalized settlement allocations without double-deducting pendingAmount.
   */
  public static async findPeriodFeedHistoryForFarmer(
    adminId: string,
    customerId: string,
    startDate: string,
    endDate: string
  ): Promise<FarmerHistoryFeedItem[]> {
    const start = getIstStartOfDay(new Date(startDate));
    const end = getIstEndOfDay(new Date(endDate));

    const rows = await prisma.foodSale.findMany({
      where: {
        adminId,
        customerId,
        isActive: true,
        pendingAmount: { gt: 0 },
        saleDate: { lte: end },
      },
      include: {
        settlementAllocations: {
          select: {
            settlementId: true,
            allocatedAmount: true,
            settlement: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ saleDate: 'asc' }, { createdAt: 'asc' }],
    });

    ReconciliationService.reconcileFeedSales(rows);

    return rows.map((row) => {
      const originalDec = new Decimal(row.totalAmount.toString()).toDecimalPlaces(2, ROUND_HALF_UP);
      const pendingDec = new Decimal(row.pendingAmount.toString()).toDecimalPlaces(2, ROUND_HALF_UP);
      const settlementDeductedDec = row.settlementAllocations
        .filter((alloc) => alloc.settlement?.status === 'FINALIZED')
        .reduce(
          (sum, alloc) => sum.plus(new Decimal(alloc.allocatedAmount.toString())),
          new Decimal(0)
        )
        .toDecimalPlaces(2, ROUND_HALF_UP);

      // pendingAmount already reflects both upfront amountPaid and finalized settlement deductions
      const totalSettledOrPaid = Decimal.max(0, originalDec.minus(pendingDec));
      const upfrontPaidDec = Decimal.max(0, totalSettledOrPaid.minus(settlementDeductedDec));

      const category =
        row.saleDate < start ? 'PREVIOUS_OUTSTANDING' : 'CURRENT_PERIOD';

      return {
        id: row.id,
        foodName: row.foodName,
        saleDate: formatIstDate(row.saleDate),
        quantity: new Decimal(row.quantity.toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        originalAmount: originalDec.toFixed(2),
        amountPaidUpfront: upfrontPaidDec.toFixed(2),
        settlementDeductedAmount: settlementDeductedDec.toFixed(2),
        remainingOutstanding: pendingDec.toFixed(2),
        category,
      };
    });
  }
  /**
   * Fetches unpaid / partially paid feed sales for a farmer.
   */
  public static async findPendingSalesForFarmer(
    adminId: string,
    customerId: string
  ): Promise<PendingFeedSaleItem[]> {
    const rows = await prisma.foodSale.findMany({
      where: {
        adminId,
        customerId,
        isActive: true,
        pendingAmount: { gt: 0 },
      },
      orderBy: { saleDate: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      foodName: row.foodName,
      quantity: row.quantity,
      sellRate: row.sellRate,
      totalAmount: row.totalAmount,
      amountPaid: row.amountPaid,
      pendingAmount: row.pendingAmount,
      saleDate: row.saleDate,
    }));
  }
}

