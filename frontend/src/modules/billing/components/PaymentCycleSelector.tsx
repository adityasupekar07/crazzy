import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { QUERY_KEYS } from '../../../queries/keys';
import { billingApi } from '../billing.api';
import {
  formatReadableYmd,
  getTodayLocalYmd,
  resolveCycleDates,
  validateCustomCycleRange,
} from '../utils/cycleResolver';
import type { PaymentCycleOption, PaymentCycleType, ResolvedCycleRange } from '../billing.types';

const FALLBACK_CYCLES: PaymentCycleOption[] = [
  { type: 'TEN_DAY', label: '10 Days' },
  { type: 'FIFTEEN_DAY', label: '15 Days' },
  { type: 'MONTHLY', label: 'Monthly' },
  { type: 'CUSTOM', label: 'Custom' },
];

interface PaymentCycleSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (range: ResolvedCycleRange) => void;
  allowFuturePeriods?: boolean;
}

export const PaymentCycleSelector: React.FC<PaymentCycleSelectorProps> = ({
  startDate,
  endDate,
  onChange,
  allowFuturePeriods = false,
}) => {
  const [cycleType, setCycleType] = useState<PaymentCycleType>('TEN_DAY');
  const [offset, setOffset] = useState<number>(0);
  const [customStart, setCustomStart] = useState<string>(startDate);
  const [customEnd, setCustomEnd] = useState<string>(endDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: QUERY_KEYS.billing.cycles(),
    queryFn: () => billingApi.getSupportedCycles(),
    staleTime: 5 * 60 * 1000,
  });

  const cycleOptions = data?.cycles?.length ? data.cycles : FALLBACK_CYCLES;
  const todayYmd = getTodayLocalYmd();

  // Resolve and propagate dates whenever preset cycleType or offset changes
  useEffect(() => {
    if (cycleType === 'CUSTOM') return;
    const resolved = resolveCycleDates(cycleType, offset);
    setValidationError(null);
    onChange({
      type: cycleType,
      startDate: resolved.startDate,
      endDate: resolved.endDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleType, offset]);

  const handleSelectCycleType = (nextType: PaymentCycleType) => {
    setValidationError(null);
    setCycleType(nextType);
    if (nextType === 'CUSTOM') {
      const initStart = startDate || todayYmd;
      const initEnd = endDate || todayYmd;
      setCustomStart(initStart);
      setCustomEnd(initEnd);
      const err = validateCustomCycleRange(initStart, initEnd, allowFuturePeriods);
      setValidationError(err);
      if (!err) {
        onChange({ type: 'CUSTOM', startDate: initStart, endDate: initEnd });
      }
    } else {
      setOffset(0);
    }
  };

  const handleCustomDateChange = (nextStart: string, nextEnd: string) => {
    setCustomStart(nextStart);
    setCustomEnd(nextEnd);
    const err = validateCustomCycleRange(nextStart, nextEnd, allowFuturePeriods);
    setValidationError(err);
    if (!err) {
      onChange({ type: 'CUSTOM', startDate: nextStart, endDate: nextEnd });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0052cc]" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Payment Cycle
          </span>
        </div>

        {/* Cycle Type Pills */}
        <div className="flex flex-wrap gap-1.5">
          {cycleOptions.map((opt) => {
            const active = cycleType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectCycleType(opt.type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  active
                    ? 'bg-[#0052cc] text-white border-[#0052cc] shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Cycle Navigation & Resolved Period */}
      {cycleType !== 'CUSTOM' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
          <div className="text-xs text-gray-700">
            <span className="text-gray-500 font-medium mr-2">Selected Period:</span>
            <strong className="text-[#091e42] font-bold">
              {formatReadableYmd(startDate)} – {formatReadableYmd(endDate)}
            </strong>
            <span className="ml-2 font-mono text-[11px] text-gray-400">
              ({startDate} to {endDate})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOffset((o) => o - 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous Cycle
            </button>

            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(0)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-[#0052cc] hover:bg-blue-50 disabled:opacity-45 transition cursor-pointer inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Current
            </button>

            <button
              type="button"
              disabled={!allowFuturePeriods && offset >= 0}
              onClick={() => setOffset((o) => o + 1)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-45 transition cursor-pointer inline-flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Custom Date Range Inputs */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Custom Start Date
            </label>
            <input
              type="date"
              value={customStart}
              max={allowFuturePeriods ? undefined : todayYmd}
              onChange={(e) => handleCustomDateChange(e.target.value, customEnd)}
              className="w-full light-input rounded-lg text-xs py-1.5 px-2.5 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Custom End Date
            </label>
            <input
              type="date"
              value={customEnd}
              max={allowFuturePeriods ? undefined : todayYmd}
              onChange={(e) => handleCustomDateChange(customStart, e.target.value)}
              className="w-full light-input rounded-lg text-xs py-1.5 px-2.5 bg-white"
            />
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};

