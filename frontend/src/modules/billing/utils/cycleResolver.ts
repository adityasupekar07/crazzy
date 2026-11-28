import type { PaymentCycleType } from '../billing.types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmd(year: number, month1Based: number, day: number): string {
  return `${year}-${pad2(month1Based)}-${pad2(day)}`;
}

export function daysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function getTodayLocalYmd(refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = refDate.getMonth() + 1;
  const d = refDate.getDate();
  return toYmd(y, m, d);
}

export function formatReadableYmd(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function validateCustomCycleRange(
  startDate: string,
  endDate: string,
  allowFuture: boolean = false,
  refDate: Date = new Date()
): string | null {
  if (!startDate || !endDate) {
    return 'Both start date and end date are required.';
  }
  if (startDate > endDate) {
    return 'Start date must be before or equal to end date.';
  }
  if (!allowFuture) {
    const today = getTodayLocalYmd(refDate);
    if (startDate > today || endDate > today) {
      return 'Future billing periods are not allowed.';
    }
  }
  return null;
}

export function resolveCycleDates(
  type: Exclude<PaymentCycleType, 'CUSTOM'>,
  offset: number = 0,
  refDate: Date = new Date()
): { startDate: string; endDate: string } {
  const curY = refDate.getFullYear();
  const curM = refDate.getMonth() + 1;
  const curD = refDate.getDate();

  if (type === 'MONTHLY') {
    const target = new Date(Date.UTC(curY, curM - 1 + offset, 1));
    const y = target.getUTCFullYear();
    const m = target.getUTCMonth() + 1;
    return {
      startDate: toYmd(y, m, 1),
      endDate: toYmd(y, m, daysInMonth(y, m)),
    };
  }

  if (type === 'FIFTEEN_DAY') {
    const curSlotIndex = (curY * 12 + (curM - 1)) * 2 + (curD <= 15 ? 0 : 1);
    const targetSlotIndex = curSlotIndex + offset;
    const totalMonths = Math.floor(targetSlotIndex / 2);
    const half = ((targetSlotIndex % 2) + 2) % 2;
    const y = Math.floor(totalMonths / 12);
    const m = (totalMonths % 12) + 1;

    if (half === 0) {
      return { startDate: toYmd(y, m, 1), endDate: toYmd(y, m, 15) };
    }
    return { startDate: toYmd(y, m, 16), endDate: toYmd(y, m, daysInMonth(y, m)) };
  }

  // TEN_DAY: 1-10, 11-20, 21-lastDay
  const curSlotInMonth = curD <= 10 ? 0 : curD <= 20 ? 1 : 2;
  const curSlotIndex = (curY * 12 + (curM - 1)) * 3 + curSlotInMonth;
  const targetSlotIndex = curSlotIndex + offset;
  const totalMonths = Math.floor(targetSlotIndex / 3);
  const slot = ((targetSlotIndex % 3) + 3) % 3;
  const y = Math.floor(totalMonths / 12);
  const m = (totalMonths % 12) + 1;

  if (slot === 0) {
    return { startDate: toYmd(y, m, 1), endDate: toYmd(y, m, 10) };
  }
  if (slot === 1) {
    return { startDate: toYmd(y, m, 11), endDate: toYmd(y, m, 20) };
  }
  return { startDate: toYmd(y, m, 21), endDate: toYmd(y, m, daysInMonth(y, m)) };
}

