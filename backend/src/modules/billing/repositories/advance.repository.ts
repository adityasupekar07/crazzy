import prisma from '../../../db/index.js';
import { formatIstDate } from '../../rateChart/utils/dateUtils.js';
import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import { FarmerHistoryAdvanceItem, PendingAdvanceItem } from '../types/billing.types.js';

export class AdvanceRepository {
  /**
   * Fetches complete advance ledger history (issued, manual repayments, and finalized
   * settlement recoveries) along with verified advance summary totals.
   */
  public static async findAdvanceHistoryForFarmer(
    adminId: string,
    customerId: string
  ): Promise<{
    items: FarmerHistoryAdvanceItem[];
    summary: { totalGiven: string; totalRepaid: string; remainingOutstanding: string };
  }> {
    const advances = await prisma.advance.findMany({
      where: {
        adminId,
        customerId,
      },
      include: {
        transactions: {
          include: {
            settlement: {
              select: {
                settlementNumber: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ givenDate: 'asc' }, { createdAt: 'asc' }],
    });

    const items: FarmerHistoryAdvanceItem[] = [];
    let totalGivenDec = new Decimal(0);
    let totalRepaidDec = new Decimal(0);
    let totalRemainingDec = new Decimal(0);

    for (const adv of advances) {
      totalGivenDec = totalGivenDec.plus(new Decimal(adv.originalAmount.toString()));
      totalRemainingDec = totalRemainingDec.plus(new Decimal(adv.pendingAmount.toString()));

      let runningBalance = new Decimal(0);

      for (const tx of adv.transactions) {
        // Ignore recoveries tied to cancelled settlements
        if (
          tx.type === 'BILL_SETTLEMENT_RECOVERY' &&
          tx.settlement &&
          tx.settlement.status === 'CANCELLED'
        ) {
          continue;
        }

        const txAmt = new Decimal(tx.amount.toString()).toDecimalPlaces(2, ROUND_HALF_UP);
        if (tx.type === 'ISSUED') {
          runningBalance = runningBalance.plus(txAmt);
        } else {
          runningBalance = Decimal.max(0, runningBalance.minus(txAmt));
          totalRepaidDec = totalRepaidDec.plus(txAmt);
        }

        const txDate = tx.type === 'ISSUED' ? adv.givenDate : tx.createdAt;
        items.push({
          id: tx.id,
          advanceId: adv.id,
          advanceNumber: adv.advanceNumber,
          date: formatIstDate(txDate),
          type: tx.type,
          amount: txAmt.toFixed(2),
          remainingBalance: runningBalance.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
          settlementNumber: tx.settlement?.settlementNumber ?? null,
          notes: tx.notes ?? null,
        });
      }
    }

    // Sort deterministically by date then advanceNumber
    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.advanceNumber.localeCompare(b.advanceNumber);
    });

    return {
      items,
      summary: {
        totalGiven: totalGivenDec.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        totalRepaid: totalRepaidDec.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        remainingOutstanding: totalRemainingDec.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
      },
    };
  }
  /**
   * Fetches active / partially recovered advances for a farmer ordered FIFO.
   */
  public static async findActiveAdvancesForFarmer(
    adminId: string,
    customerId: string
  ): Promise<PendingAdvanceItem[]> {
    const rows = await prisma.advance.findMany({
      where: {
        adminId,
        customerId,
        status: { in: ['ACTIVE', 'PARTIALLY_RECOVERED'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      advanceNumber: row.advanceNumber,
      originalAmount: Number(row.originalAmount),
      recoveredAmount: Number(row.recoveredAmount),
      pendingAmount: Number(row.pendingAmount),
      status: row.status,
      givenDate: row.givenDate,
    }));
  }

  /**
   * Applies an advance recovery transactionally across FIFO active advances.
   */
  public static async applySettlementDeduction(
    adminId: string,
    activeAdvances: PendingAdvanceItem[],
    deductionAmount: number,
    periodLabel: string
  ): Promise<void> {
    if (deductionAmount <= 0) return;

    let remainingDeduction = deductionAmount;

    for (const adv of activeAdvances) {
      if (remainingDeduction <= 0) break;

      const deductAmt = Math.min(remainingDeduction, adv.pendingAmount);
      if (deductAmt <= 0) continue;

      const newPending = adv.pendingAmount - deductAmt;
      const newRecovered = adv.recoveredAmount + deductAmt;
      const newStatus = newPending === 0 ? 'CLOSED' : 'PARTIALLY_RECOVERED';

      await prisma.$transaction(async (tx) => {
        await tx.advanceTransaction.create({
          data: {
            advanceId: adv.id,
            type: 'MANUAL_REPAYMENT',
            amount: deductAmt,
            notes: `Auto-deducted during bill settlement (${periodLabel})`,
            createdBy: adminId,
          },
        });

        await tx.advance.update({
          where: { id: adv.id },
          data: {
            pendingAmount: newPending,
            recoveredAmount: newRecovered,
            status: newStatus,
          },
        });
      });

      remainingDeduction -= deductAmt;
    }
  }
}

