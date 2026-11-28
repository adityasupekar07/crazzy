import crypto from 'crypto';
import { Decimal } from 'decimal.js';
import ApiError from '../../../utils/ApiError.js';
import {
  BillingPreviewRequest,
  BillingPreviewResponse,
  BillingPreviewRequestDto,
  BillingPreviewResponseDto,
} from '../dto/billing-preview.dto.js';
import { BillingRepository } from '../repositories/billing.repository.js';
import { MilkCollectionRepository } from '../repositories/milk-collection.repository.js';
import { FeedRepository } from '../repositories/feed.repository.js';
import { AdvanceRepository } from '../repositories/advance.repository.js';
import { BillingCycleService } from './billing-cycle.service.js';
import { FarmerHistoryService } from './farmer-history.service.js';
import {
  BillingCalculationService,
  calculateBillingSettlement,
} from './billing-calculation.service.js';
import { SettlementValidationService } from './settlement-validation.service.js';

const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function formatMoney(value: Decimal): string {
  return value.toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Prepares a read-only billing settlement preview for a farmer and payment cycle.
 */
export class BillingPreviewService {
  public static async generateBillingPreview(
    adminId: string,
    dto: BillingPreviewRequest
  ): Promise<BillingPreviewResponse> {
    // 1. Verify authenticated dairy and farmer ownership
    const farmer = await BillingRepository.findCustomerForDairy(adminId, dto.farmerId);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found or access denied');
    }

    // 2. Validate billing period & cycle rules
    const billingPeriod = BillingCycleService.validateAndResolveCycleDates({
      adminId,
      cycleType: dto.cycleType,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    // 3. Fetch eligible milk collections, unsettled feed sales, and outstanding advances (read-only)
    const [allMilkEntries, feedSales, advanceData] = await Promise.all([
      MilkCollectionRepository.findPeriodHistoryForFarmer(
        adminId,
        farmer.id,
        billingPeriod.startDate,
        billingPeriod.endDate
      ),
      FeedRepository.findPeriodFeedHistoryForFarmer(
        adminId,
        farmer.id,
        billingPeriod.startDate,
        billingPeriod.endDate
      ),
      AdvanceRepository.findAdvanceHistoryForFarmer(adminId, farmer.id),
    ]);

    // Exclude collections already settled in a finalized settlement
    const milkCollections = allMilkEntries.filter((entry) => !entry.isSettled);

    // 4. Calculate total litres, total milk amount, and feed sub-totals using Decimal-safe arithmetic
    let totalLitresDec = new MoneyDecimal(0);
    let totalMilkAmountDec = new MoneyDecimal(0);
    for (const entry of milkCollections) {
      totalLitresDec = totalLitresDec.plus(new MoneyDecimal(entry.litres));
      totalMilkAmountDec = totalMilkAmountDec.plus(new MoneyDecimal(entry.amount));
    }

    let previousFeedDec = new MoneyDecimal(0);
    let currentFeedDec = new MoneyDecimal(0);
    for (const sale of feedSales) {
      const rem = new MoneyDecimal(sale.remainingOutstanding);
      if (sale.category === 'PREVIOUS_OUTSTANDING') {
        previousFeedDec = previousFeedDec.plus(rem);
      } else {
        currentFeedDec = currentFeedDec.plus(rem);
      }
    }
    const totalFeedOutstandingDec = previousFeedDec.plus(currentFeedDec);

    const totalMilkAmount = formatMoney(totalMilkAmountDec);
    const totalFeedOutstanding = formatMoney(totalFeedOutstandingDec);
    const totalAdvanceOutstanding = formatMoney(
      new MoneyDecimal(advanceData.summary.remainingOutstanding)
    );

    // 5. Call pure Phase 6 calculation service
    const calculation = calculateBillingSettlement({
      totalMilkAmount,
      totalFeedOutstanding,
      totalAdvanceOutstanding,
    });

    const totalDeductionsDec = new MoneyDecimal(calculation.feedDeducted).plus(
      new MoneyDecimal(calculation.advanceDeducted)
    );

    // 6. Generate previewId, calculationSnapshot, and deterministic financial-state fingerprint
    const advanceIds = Array.from(new Set(advanceData.items.map((item) => item.advanceId))).sort();
    const calculationSnapshot = {
      totalMilkAmount,
      totalFeedOutstanding,
      totalAdvanceOutstanding,
      milkEntryIds: milkCollections.map((m) => m.id),
      feedSaleIds: feedSales.map((f) => f.id),
      advanceIds,
    };

    const fingerprintSource = {
      adminId,
      farmerId: farmer.id,
      billingPeriod,
      milk: milkCollections.map((m) => ({
        id: m.id,
        litres: m.litres,
        amount: m.amount,
      })),
      feed: feedSales.map((f) => ({
        id: f.id,
        remainingOutstanding: f.remainingOutstanding,
      })),
      advance: {
        totalAdvanceOutstanding,
        transactions: advanceData.items.map((a) => ({
          id: a.id,
          advanceId: a.advanceId,
          type: a.type,
          amount: a.amount,
          remainingBalance: a.remainingBalance,
        })),
      },
    };

    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintSource))
      .digest('hex');

    return {
      previewId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      fingerprint,
      calculationSnapshot,
      farmer: {
        id: farmer.id,
        code: farmer.code,
        name: farmer.name,
        mobile: farmer.mobile,
        isActive: farmer.isActive,
      },
      billingPeriod,
      milkCollections,
      milkSummary: {
        totalLitres: formatMoney(totalLitresDec),
        totalAmount: calculation.totalMilkAmount,
      },
      feedSales,
      feedSummary: {
        previousOutstanding: formatMoney(previousFeedDec),
        currentSales: formatMoney(currentFeedDec),
        totalOutstanding: calculation.totalFeedOutstanding,
        deducted: calculation.feedDeducted,
        remaining: calculation.remainingFeed,
      },
      advanceHistory: advanceData.items,
      advanceSummary: {
        totalOutstanding: calculation.totalAdvanceOutstanding,
        deducted: calculation.advanceDeducted,
        remaining: calculation.remainingAdvance,
      },
      settlementSummary: {
        grossAmount: calculation.totalMilkAmount,
        totalDeductions: formatMoney(totalDeductionsDec),
        netPayable: calculation.finalPayable,
      },
    };
  }

  public static async generatePreview(
    adminId: string,
    dto: BillingPreviewRequestDto
  ): Promise<BillingPreviewResponseDto> {
    const cycle = BillingCycleService.resolveCustomWindow(dto.startDate, dto.endDate);
    const history = await FarmerHistoryService.getFarmerHistoryForCycle(
      adminId,
      dto.customerId,
      cycle
    );

    const requestedFeed = dto.requestedFeedDeduction ?? 0;
    const requestedAdvance = dto.requestedAdvanceDeduction ?? 0;

    SettlementValidationService.validateDeductions({
      grossAmount: history.milk.grossAmount,
      requestedFeedDeduction: requestedFeed,
      requestedAdvanceDeduction: requestedAdvance,
      totalPendingFeed: history.feed.totalPendingFeed,
      totalPendingAdvance: history.advance.totalPendingAdvance,
    });

    const calculation = BillingCalculationService.calculate({
      grossMilkAmount: history.milk.grossAmount,
      totalPendingFeed: history.feed.totalPendingFeed,
      totalPendingAdvance: history.advance.totalPendingAdvance,
      requestedFeedDeduction: requestedFeed,
      requestedAdvanceDeduction: requestedAdvance,
    });

    return {
      customer: {
        id: history.customerId,
        code: history.customerCode,
        name: history.customerName,
        mobile: history.customerMobile,
      },
      cycle,
      milkSummary: {
        totalLitres: history.milk.totalLitres,
        grossAmount: history.milk.grossAmount,
        avgFat: history.milk.avgFat,
        avgSnf: history.milk.avgSnf,
        entryCount: history.milk.entryCount,
        entryIds: history.milk.entryIds,
      },
      outstandingSummary: {
        pendingFeedAmount: history.feed.totalPendingFeed,
        pendingFeedSalesCount: history.feed.pendingSalesCount,
        pendingAdvanceAmount: history.advance.totalPendingAdvance,
        activeAdvancesCount: history.advance.activeAdvancesCount,
      },
      calculation,
    };
  }
}
