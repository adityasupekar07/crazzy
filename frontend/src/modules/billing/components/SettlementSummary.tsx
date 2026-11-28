import React from 'react';
import { Milk, Package, Wallet, IndianRupee, ArrowRight } from 'lucide-react';
import type { BillingPreviewResponse } from '../billing.types';

interface SettlementSummaryProps {
  preview: BillingPreviewResponse;
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const SettlementSummary: React.FC<SettlementSummaryProps> = ({ preview }) => {
  const { milkSummary, feedSummary, advanceSummary, settlementSummary } = preview;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Milk Summary */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0052cc] uppercase tracking-wider">
            <span>Milk Summary</span>
            <Milk className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Total Milk Quantity</span>
              <span className="font-mono font-semibold text-gray-900">
                {milkSummary.totalLitres} L
              </span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold pt-1.5 border-t border-blue-200">
              <span>Total Milk Amount</span>
              <span className="font-mono text-sm text-[#0052cc]">
                {formatInr(milkSummary.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Feed Deduction */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
            <span>Feed Deduction</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Previous Outstanding</span>
              <span className="font-mono font-medium text-gray-800">
                {formatInr(feedSummary.previousOutstanding)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Current Period Sales</span>
              <span className="font-mono font-medium text-gray-800">
                {formatInr(feedSummary.currentSales)}
              </span>
            </div>
            <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-amber-200">
              <span>Total Feed Outstanding</span>
              <span className="font-mono">{formatInr(feedSummary.totalOutstanding)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold">
              <span>Deducted This Settlement</span>
              <span className="font-mono">-{formatInr(feedSummary.deducted)}</span>
            </div>
            <div className="flex justify-between text-amber-900 font-semibold pt-1 border-t border-amber-200">
              <span>Carry-Forward Remaining</span>
              <span className="font-mono">{formatInr(feedSummary.remaining)}</span>
            </div>
          </div>
        </div>

        {/* Advance Deduction */}
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase tracking-wider">
            <span>Advance Deduction</span>
            <Wallet className="w-4 h-4 text-rose-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-800 font-semibold">
              <span>Total Advance Outstanding</span>
              <span className="font-mono">{formatInr(advanceSummary.totalOutstanding)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-rose-200">
              <span>Deducted This Settlement</span>
              <span className="font-mono">-{formatInr(advanceSummary.deducted)}</span>
            </div>
            <div className="flex justify-between text-rose-900 font-semibold pt-1 border-t border-rose-200">
              <span>Carry-Forward Remaining</span>
              <span className="font-mono">{formatInr(advanceSummary.remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Settlement */}
      <div className="p-5 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Gross Milk Amount
            </span>
            <span className="font-mono text-base font-bold">
              {formatInr(settlementSummary.grossAmount)}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Total Deductions (Feed + Advance)
            </span>
            <span className="font-mono text-base font-bold text-rose-300">
              -{formatInr(settlementSummary.totalDeductions)}
            </span>
          </div>
        </div>

        <div className="md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-700">
          <span className="text-emerald-300 block uppercase tracking-wider text-[10px] font-bold">
            Final Payable Amount to Farmer
          </span>
          <div className="flex items-center md:justify-end gap-1 mt-0.5">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-2xl font-extrabold text-emerald-400">
              {formatInr(settlementSummary.netPayable).replace(/^₹/, '')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

