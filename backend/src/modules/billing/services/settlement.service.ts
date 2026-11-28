import crypto from 'crypto';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../config/logger.js';
import { BillingRepository } from '../repositories/billing.repository.js';
import { AdvanceRepository } from '../repositories/advance.repository.js';
import { FeedRepository } from '../repositories/feed.repository.js';
import { BillingCalculationService } from './billing-calculation.service.js';
import { SettlementValidationService } from './settlement-validation.service.js';
import { CreateSettlementRequestDto, SettlementResponseDto } from '../dto/settlement.dto.js';
import { SettlementRecord } from '../types/billing.types.js';

/**
 * Finalizes and persists farmer bill settlements.
 */
export class SettlementService {
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

