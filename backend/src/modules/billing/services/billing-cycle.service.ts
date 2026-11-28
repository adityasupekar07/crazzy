import { PaymentPeriod } from '@prisma/client';
import ApiError from '../../../utils/ApiError.js';
import { formatIstDate } from '../../rateChart/utils/dateUtils.js';
import { BillingRepository } from '../repositories/billing.repository.js';
import {
  BillingCycleWindow,
  CycleOption,
  SupportedCycleType,
} from '../types/billing.types.js';

export interface DairyCycleConfig {
  supportedTypes: SupportedCycleType[];
  allowFuturePeriods: boolean;
  tenDaySplits: [number, number]; // e.g., [10, 20] -> 1-10, 11-20, 21-end
  fifteenDaySplit: number;        // e.g., 15 -> 1-15, 16-end
}

const DEFAULT_CYCLE_CONFIG: DairyCycleConfig = {
  supportedTypes: ['TEN_DAY', 'FIFTEEN_DAY', 'MONTHLY', 'CUSTOM'],
  allowFuturePeriods: false,
  tenDaySplits: [10, 20],
  fifteenDaySplit: 15,
};

const CYCLE_LABELS: Record<SupportedCycleType, string> = {
  TEN_DAY: '10 Days',
  FIFTEEN_DAY: '15 Days',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toYmd(year: number, month1Based: number, day: number): string {
  return `${year}-${pad2(month1Based)}-${pad2(day)}`;
}

function daysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

function parseYmd(dateStr: string): { year: number; month: number; day: number } {
  const trimmed = dateStr.trim();
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const maxDay = daysInMonth(year, month);
    if (month < 1 || month > 12 || day < 1 || day > maxDay) {
      throw new ApiError(400, `Invalid calendar date: ${dateStr}`);
    }
    return { year, month, day };
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new ApiError(400, `Invalid date format: ${dateStr}`);
  }
  const istYmd = formatIstDate(parsed);
  const [year, month, day] = istYmd.split('-').map(Number);
  return { year, month, day };
}

/**
 * Resolves and validates payment cycle date windows in the dairy's local timezone (IST).
 */
export class BillingCycleService {
  public static getCycleConfig(_adminId?: string): DairyCycleConfig {
    return { ...DEFAULT_CYCLE_CONFIG };
  }

  public static getSupportedCycles(adminId?: string): { cycles: CycleOption[] } {
    const config = this.getCycleConfig(adminId);
    return {
      cycles: config.supportedTypes.map((type) => ({
        type,
        label: CYCLE_LABELS[type],
      })),
    };
  }

  public static validateCycleDates(
    startDate: string,
    endDate: string,
    options: { allowFuturePeriods?: boolean; referenceDate?: Date } = {}
  ): { startDate: string; endDate: string } {
    const startParts = parseYmd(startDate);
    const endParts = parseYmd(endDate);

    const startYmd = toYmd(startParts.year, startParts.month, startParts.day);
    const endYmd = toYmd(endParts.year, endParts.month, endParts.day);

    if (startYmd > endYmd) {
      throw new ApiError(400, 'Start date must be before or equal to end date');
    }

    const allowFuture = options.allowFuturePeriods ?? false;
    if (!allowFuture) {
      const todayIst = formatIstDate(options.referenceDate ?? new Date());
      if (startYmd > todayIst || endYmd > todayIst) {
        throw new ApiError(400, 'Future billing periods are not allowed');
      }
    }

    return { startDate: startYmd, endDate: endYmd };
  }

  public static resolveCustomWindow(
    startDate: string,
    endDate: string,
    options: { allowFuturePeriods?: boolean; referenceDate?: Date } = {}
  ): BillingCycleWindow {
    const validated = this.validateCycleDates(startDate, endDate, options);
    return {
      ...validated,
      periodType: 'CUSTOM',
    };
  }

  /**
   * Validates that the supplied startDate/endDate are valid calendar dates,
   * respect dairy future-period policy, and match the selected cycleType's period rules.
   */
  public static validateAndResolveCycleDates(params: {
    adminId?: string;
    cycleType: SupportedCycleType;
    startDate: string;
    endDate: string;
    referenceDate?: Date;
  }): { cycleType: SupportedCycleType; startDate: string; endDate: string } {
    const config = this.getCycleConfig(params.adminId);
    if (!config.supportedTypes.includes(params.cycleType)) {
      throw new ApiError(400, `Unsupported payment cycle type: ${params.cycleType}`);
    }

    const validated = this.validateCycleDates(params.startDate, params.endDate, {
      allowFuturePeriods: config.allowFuturePeriods,
      referenceDate: params.referenceDate,
    });

    if (params.cycleType === 'CUSTOM') {
      return { cycleType: params.cycleType, ...validated };
    }

    const [sy, sm, sd] = validated.startDate.split('-').map(Number);
    const [ey, em, ed] = validated.endDate.split('-').map(Number);
    if (sy !== ey || sm !== em) {
      throw new ApiError(
        400,
        `${params.cycleType} cycle startDate and endDate must fall within the same calendar month`
      );
    }

    const monthEnd = daysInMonth(sy, sm);

    if (params.cycleType === 'MONTHLY') {
      if (sd !== 1 || ed !== monthEnd) {
        throw new ApiError(
          400,
          `MONTHLY cycle must span 1st to ${monthEnd}th of the month`
        );
      }
    } else if (params.cycleType === 'FIFTEEN_DAY') {
      const split = config.fifteenDaySplit;
      const isFirstHalf = sd === 1 && ed === split;
      const isSecondHalf = sd === split + 1 && ed === monthEnd;
      if (!isFirstHalf && !isSecondHalf) {
        throw new ApiError(
          400,
          `FIFTEEN_DAY cycle must be 1-${split} or ${split + 1}-${monthEnd}`
        );
      }
    } else if (params.cycleType === 'TEN_DAY') {
      const [s1, s2] = config.tenDaySplits;
      const isFirst = sd === 1 && ed === s1;
      const isSecond = sd === s1 + 1 && ed === s2;
      const isThird = sd === s2 + 1 && ed === monthEnd;
      if (!isFirst && !isSecond && !isThird) {
        throw new ApiError(
          400,
          `TEN_DAY cycle must be 1-${s1}, ${s1 + 1}-${s2}, or ${s2 + 1}-${monthEnd}`
        );
      }
    }

    return { cycleType: params.cycleType, ...validated };
  }

  public static resolveCycleWindow(params: {
    type: SupportedCycleType;
    offset?: number;
    startDate?: string;
    endDate?: string;
    referenceDate?: Date;
    adminId?: string;
  }): BillingCycleWindow {
    const config = this.getCycleConfig(params.adminId);
    if (!config.supportedTypes.includes(params.type)) {
      throw new ApiError(400, `Unsupported payment cycle type: ${params.type}`);
    }

    const refDate = params.referenceDate ?? new Date();

    if (params.type === 'CUSTOM') {
      if (!params.startDate || !params.endDate) {
        throw new ApiError(400, 'Start date and end date are required for CUSTOM cycle');
      }
      return this.resolveCustomWindow(params.startDate, params.endDate, {
        allowFuturePeriods: config.allowFuturePeriods,
        referenceDate: refDate,
      });
    }

    const offset = params.offset ?? 0;
    if (offset > 0 && !config.allowFuturePeriods) {
      throw new ApiError(400, 'Future billing periods are not allowed');
    }

    const todayIst = formatIstDate(refDate);
    const [curY, curM, curD] = todayIst.split('-').map(Number);

    let startYmd = '';
    let endYmd = '';

    if (params.type === 'MONTHLY') {
      const targetDate = new Date(Date.UTC(curY, curM - 1 + offset, 1));
      const y = targetDate.getUTCFullYear();
      const m = targetDate.getUTCMonth() + 1;
      startYmd = toYmd(y, m, 1);
      endYmd = toYmd(y, m, daysInMonth(y, m));
    } else if (params.type === 'FIFTEEN_DAY') {
      const split = config.fifteenDaySplit;
      const curSlotIndex = (curY * 12 + (curM - 1)) * 2 + (curD <= split ? 0 : 1);
      const targetSlotIndex = curSlotIndex + offset;
      const totalMonths = Math.floor(targetSlotIndex / 2);
      const half = ((targetSlotIndex % 2) + 2) % 2;
      const y = Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;

      if (half === 0) {
        startYmd = toYmd(y, m, 1);
        endYmd = toYmd(y, m, split);
      } else {
        startYmd = toYmd(y, m, split + 1);
        endYmd = toYmd(y, m, daysInMonth(y, m));
      }
    } else if (params.type === 'TEN_DAY') {
      const [s1, s2] = config.tenDaySplits;
      const curSlotInMonth = curD <= s1 ? 0 : curD <= s2 ? 1 : 2;
      const curSlotIndex = (curY * 12 + (curM - 1)) * 3 + curSlotInMonth;
      const targetSlotIndex = curSlotIndex + offset;
      const totalMonths = Math.floor(targetSlotIndex / 3);
      const slot = ((targetSlotIndex % 3) + 3) % 3;
      const y = Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;

      if (slot === 0) {
        startYmd = toYmd(y, m, 1);
        endYmd = toYmd(y, m, s1);
      } else if (slot === 1) {
        startYmd = toYmd(y, m, s1 + 1);
        endYmd = toYmd(y, m, s2);
      } else {
        startYmd = toYmd(y, m, s2 + 1);
        endYmd = toYmd(y, m, daysInMonth(y, m));
      }
    }

    return {
      startDate: startYmd,
      endDate: endYmd,
      periodType: params.type,
    };
  }

  public static async resolveCurrentCycleForDairy(
    adminId: string,
    referenceDate: Date = new Date()
  ): Promise<BillingCycleWindow> {
    const period = (await BillingRepository.findDairyPaymentPeriod(adminId)) ?? PaymentPeriod.WEEKLY;
    const endIst = formatIstDate(referenceDate);
    const [y, m, d] = endIst.split('-').map(Number);

    let startDateObj: Date;
    switch (period) {
      case PaymentPeriod.DAILY:
        startDateObj = new Date(Date.UTC(y, m - 1, d));
        break;
      case PaymentPeriod.BIWEEKLY:
        startDateObj = new Date(Date.UTC(y, m - 1, d - 13));
        break;
      case PaymentPeriod.MONTHLY:
        startDateObj = new Date(Date.UTC(y, m - 1, 1));
        break;
      case PaymentPeriod.WEEKLY:
      default:
        startDateObj = new Date(Date.UTC(y, m - 1, d - 6));
        break;
    }

    return {
      startDate: startDateObj.toISOString().split('T')[0],
      endDate: endIst,
      periodType: period,
    };
  }
}
