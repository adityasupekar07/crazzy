import prisma from '../../../db/index.js';
import { getIstStartOfDay, getIstEndOfDay, formatIstDate } from '../../rateChart/utils/dateUtils.js';
import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import { FarmerHistoryMilkItem, MilkEntryItem } from '../types/billing.types.js';

export class MilkCollectionRepository {
  /**
   * Fetches all non-reversed milk entries for a farmer in the period,
   * preserving historical rate/amount and identifying finalized settlement status.
   */
  public static async findPeriodHistoryForFarmer(
    adminId: string,
    customerId: string,
    startDate: string,
    endDate: string
  ): Promise<FarmerHistoryMilkItem[]> {
    const start = getIstStartOfDay(new Date(startDate));
    const end = getIstEndOfDay(new Date(endDate));

    const rows = await prisma.milkEntry.findMany({
      where: {
        customerId,
        customer: { adminId },
        isReversed: false,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        settlementEntry: {
          select: {
            settlementId: true,
            settlement: {
              select: {
                settlementNumber: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { shift: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map((row) => {
      const finalizedSettlement =
        row.settlementEntry?.settlement?.status === 'FINALIZED'
          ? row.settlementEntry.settlement
          : null;
      const isSettled = Boolean(row.isSettled || finalizedSettlement);

      return {
        id: row.id,
        date: formatIstDate(row.date),
        shift: row.shift,
        milkType: row.milkType,
        litres: new Decimal(row.quantity.toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        fat: new Decimal((row.fat ?? 0).toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        snf: new Decimal((row.snf ?? 0).toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        rate: new Decimal((row.rate ?? 0).toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        amount: new Decimal((row.totalAmount ?? 0).toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        isSettled,
        settlementNumber: finalizedSettlement?.settlementNumber ?? null,
      };
    });
  }
  /**
   * Fetches non-reversed milk entries for a farmer within an inclusive IST date range.
   */
  public static async findBillableEntriesForFarmer(
    adminId: string,
    customerId: string,
    startDate: string,
    endDate: string
  ): Promise<MilkEntryItem[]> {
    const start = getIstStartOfDay(new Date(startDate));
    const end = getIstEndOfDay(new Date(endDate));

    const rows = await prisma.milkEntry.findMany({
      where: {
        customerId,
        customer: { adminId },
        isReversed: false,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [{ date: 'asc' }, { shift: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      shift: row.shift,
      milkType: row.milkType,
      quantity: Number(row.quantity),
      fat: Number(row.fat ?? 0),
      snf: Number(row.snf ?? 0),
      rate: Number(row.rate ?? 0),
      totalAmount: Number(row.totalAmount ?? 0),
    }));
  }
}

