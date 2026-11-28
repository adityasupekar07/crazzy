import ApiError from '../../../utils/ApiError.js';
import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import { BillingRepository } from '../repositories/billing.repository.js';
import { MilkCollectionRepository } from '../repositories/milk-collection.repository.js';
import { FeedRepository } from '../repositories/feed.repository.js';
import { AdvanceRepository } from '../repositories/advance.repository.js';
import { BillingCycleService } from './billing-cycle.service.js';
import { calculateWeightedMilkStats, roundCurrency } from '../utils/billing-calculation.utils.js';
import {
  BillingCycleWindow,
  FarmerConsolidatedHistory,
  FarmerHistoryResponse,
} from '../types/billing.types.js';

/**
 * Fetches consolidated collection, feed, and advance history for a farmer.
 */
export class FarmerHistoryService {
  public static async getFarmerHistoryForCycle(
    adminId: string,
    customerId: string,
    cycle: BillingCycleWindow
  ): Promise<FarmerConsolidatedHistory> {
    const customer = await BillingRepository.findCustomerForDairy(adminId, customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found or access denied');
    }

    const [entries, pendingSales, activeAdvances] = await Promise.all([
      MilkCollectionRepository.findBillableEntriesForFarmer(
        adminId,
        customerId,
        cycle.startDate,
        cycle.endDate
      ),
      FeedRepository.findPendingSalesForFarmer(adminId, customerId),
      AdvanceRepository.findActiveAdvancesForFarmer(adminId, customerId),
    ]);

    const milkStats = calculateWeightedMilkStats(entries);
    const totalPendingFeed = roundCurrency(
      pendingSales.reduce((sum, s) => sum + s.pendingAmount, 0)
    );
    const totalPendingAdvance = roundCurrency(
      activeAdvances.reduce((sum, a) => sum + a.pendingAmount, 0)
    );

    return {
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      customerMobile: customer.mobile,
      cycle,
      milk: {
        ...milkStats,
        entryCount: entries.length,
        entryIds: entries.map((e) => e.id),
        entries,
      },
      feed: {
        totalPendingFeed,
        pendingSalesCount: pendingSales.length,
        pendingSales,
      },
      advance: {
        totalPendingAdvance,
        activeAdvancesCount: activeAdvances.length,
        activeAdvances,
      },
    };
  }

  /**
   * Fetches Phase 5 farmer history (milk collections, feed sales, advance ledger)
   * with Decimal-safe summaries for the selected dairy-local date window.
   */
  public static async getFarmerBillingHistory(
    adminId: string,
    farmerId: string,
    startDate: string,
    endDate: string
  ): Promise<FarmerHistoryResponse> {
    const period = BillingCycleService.validateCycleDates(startDate, endDate, {
      allowFuturePeriods: true,
    });

    const farmer = await BillingRepository.findCustomerForDairy(adminId, farmerId);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found or access denied');
    }

    const [milkCollections, feedSales, advanceData] = await Promise.all([
      MilkCollectionRepository.findPeriodHistoryForFarmer(
        adminId,
        farmerId,
        period.startDate,
        period.endDate
      ),
      FeedRepository.findPeriodFeedHistoryForFarmer(
        adminId,
        farmerId,
        period.startDate,
        period.endDate
      ),
      AdvanceRepository.findAdvanceHistoryForFarmer(adminId, farmerId),
    ]);

    let eligibleLitres = new Decimal(0);
    let eligibleAmount = new Decimal(0);
    let eligibleCount = 0;
    let settledCount = 0;

    for (const item of milkCollections) {
      if (item.isSettled) {
        settledCount += 1;
      } else {
        eligibleCount += 1;
        eligibleLitres = eligibleLitres.plus(new Decimal(item.litres));
        eligibleAmount = eligibleAmount.plus(new Decimal(item.amount));
      }
    }

    let previousOutstanding = new Decimal(0);
    let currentSales = new Decimal(0);

    for (const sale of feedSales) {
      const rem = new Decimal(sale.remainingOutstanding);
      if (sale.category === 'PREVIOUS_OUTSTANDING') {
        previousOutstanding = previousOutstanding.plus(rem);
      } else {
        currentSales = currentSales.plus(rem);
      }
    }

    const totalFeedOutstanding = previousOutstanding.plus(currentSales);

    return {
      farmer: {
        id: farmer.id,
        code: farmer.code,
        name: farmer.name,
        mobile: farmer.mobile,
        isActive: farmer.isActive,
      },
      period,
      milkCollections,
      milkSummary: {
        totalLitres: eligibleLitres.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        totalAmount: eligibleAmount.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        eligibleCount,
        settledCount,
      },
      feedSales,
      feedSummary: {
        previousOutstanding: previousOutstanding.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        currentSales: currentSales.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
        totalOutstanding: totalFeedOutstanding.toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2),
      },
      advanceHistory: advanceData.items,
      advanceSummary: advanceData.summary,
    };
  }
}

