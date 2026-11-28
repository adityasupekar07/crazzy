import React from 'react';
import { Milk, Package, Wallet, UserCheck, Calendar } from 'lucide-react';
import type { FarmerHistoryResponse } from '../billing.types';

interface FarmerFinancialSummaryProps {
  history: FarmerHistoryResponse;
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const FarmerFinancialSummary: React.FC<FarmerFinancialSummaryProps> = ({ history }) => {
  const { farmer, period, milkSummary, feedSummary, advanceSummary } = history;

  return (
    <div className="space-y-4">
      <div className="light-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0052cc] flex items-center justify-center font-bold text-sm border border-blue-100">
            #{farmer.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">{farmer.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  farmer.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {farmer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Mobile: {farmer.mobile}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-gray-200 text-xs text-gray-700 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#0052cc]" />
          <span>
            Period: <strong>{period.startDate}</strong> to <strong>{period.endDate}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="light-panel p-4 rounded-xl border-l-4 border-l-[#0052cc]">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Eligible Milk Collection</span>
            <Milk className="w-4 h-4 text-[#0052cc]" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatInr(milkSummary.totalAmount)}
          </div>
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Litres: <strong>{milkSummary.totalLitres} L</strong>
            </span>
            <span>
              Eligible: <strong>{milkSummary.eligibleCount}</strong>
            </span>
            {milkSummary.settledCount > 0 && (
              <span className="text-amber-700">
                Already Settled: <strong>{milkSummary.settledCount}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="light-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Feed Outstanding</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatInr(feedSummary.totalOutstanding)}
          </div>
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Previous: <strong>{formatInr(feedSummary.previousOutstanding)}</strong>
            </span>
            <span>
              Current Period: <strong>{formatInr(feedSummary.currentSales)}</strong>
            </span>
          </div>
        </div>

        <div className="light-panel p-4 rounded-xl border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Advance Balance</span>
            <Wallet className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatInr(advanceSummary.remainingOutstanding)}
          </div>
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Given: <strong>{formatInr(advanceSummary.totalGiven)}</strong>
            </span>
            <span>
              Repaid: <strong>{formatInr(advanceSummary.totalRepaid)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

