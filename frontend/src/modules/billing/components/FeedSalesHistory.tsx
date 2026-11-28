import React from 'react';
import { Package } from 'lucide-react';
import type { FarmerHistoryFeedItem } from '../billing.types';

interface FeedSalesHistoryProps {
  items: FarmerHistoryFeedItem[];
  summary: {
    previousOutstanding: string;
    currentSales: string;
    totalOutstanding: string;
  };
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const FeedSalesHistory: React.FC<FeedSalesHistoryProps> = ({ items, summary }) => {
  return (
    <div className="light-panel rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-gray-900">Feed Sales & Outstanding</h4>
          <span className="text-xs text-gray-500">({items.length} records)</span>
        </div>
        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
          <span>
            Previous: <strong className="text-gray-900">{formatInr(summary.previousOutstanding)}</strong>
          </span>
          <span>
            Current: <strong className="text-gray-900">{formatInr(summary.currentSales)}</strong>
          </span>
          <span>
            Total Pending: <strong className="text-amber-700">{formatInr(summary.totalOutstanding)}</strong>
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">
          No outstanding feed sales or current-period feed purchases for this farmer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Sale Date</th>
                <th className="py-2.5 px-3">Feed Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Original</th>
                <th className="py-2.5 px-3 text-right">Paid Upfront</th>
                <th className="py-2.5 px-3 text-right">Settled</th>
                <th className="py-2.5 px-4 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/20">
                  <td className="py-2.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {row.saleDate}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{row.foodName}</td>
                  <td className="py-2.5 px-3">
                    {row.category === 'PREVIOUS_OUTSTANDING' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Previous Outstanding
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0052cc] border border-blue-200">
                        Current Period
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">{row.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatInr(row.originalAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {formatInr(row.amountPaidUpfront)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-600">
                    {formatInr(row.settlementDeductedAmount)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-700">
                    {formatInr(row.remainingOutstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

