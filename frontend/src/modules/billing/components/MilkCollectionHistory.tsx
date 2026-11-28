import React from 'react';
import { Milk, CheckCircle2, Clock } from 'lucide-react';
import type { FarmerHistoryMilkItem } from '../billing.types';

interface MilkCollectionHistoryProps {
  items: FarmerHistoryMilkItem[];
  summary: {
    totalLitres: string;
    totalAmount: string;
    eligibleCount: number;
    settledCount: number;
  };
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const MilkCollectionHistory: React.FC<MilkCollectionHistoryProps> = ({
  items,
  summary,
}) => {
  return (
    <div className="light-panel rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Milk className="w-4 h-4 text-[#0052cc]" />
          <h4 className="text-sm font-bold text-gray-900">Milk Collection History</h4>
          <span className="text-xs text-gray-500">({items.length} entries)</span>
        </div>
        <div className="text-xs text-gray-600 flex items-center gap-3">
          <span>
            Eligible: <strong className="text-gray-900">{summary.totalLitres} L</strong>
          </span>
          <span>
            Gross: <strong className="text-[#0052cc]">{formatInr(summary.totalAmount)}</strong>
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">
          No milk collection entries recorded for this farmer in the selected period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Shift</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Litres</th>
                <th className="py-2.5 px-3 text-right">FAT %</th>
                <th className="py-2.5 px-3 text-right">SNF %</th>
                <th className="py-2.5 px-3 text-right">Rate/L</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={row.isSettled ? 'bg-gray-50/70 text-gray-500' : 'hover:bg-blue-50/30'}
                >
                  <td className="py-2.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-2.5 px-3">{row.shift}</td>
                  <td className="py-2.5 px-3">{row.milkType}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{row.litres}</td>
                  <td className="py-2.5 px-3 text-right">{row.fat}</td>
                  <td className="py-2.5 px-3 text-right">{row.snf}</td>
                  <td className="py-2.5 px-3 text-right">{formatInr(row.rate)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.isSettled ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        title={row.settlementNumber ? `Settled in ${row.settlementNumber}` : undefined}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {row.settlementNumber ? `Settled (${row.settlementNumber})` : 'Settled'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0052cc] border border-blue-200">
                        <Clock className="w-3 h-3" />
                        Eligible
                      </span>
                    )}
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

