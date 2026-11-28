import React from 'react';
import { Wallet } from 'lucide-react';
import type { FarmerHistoryAdvanceItem } from '../billing.types';

interface AdvanceHistoryProps {
  items: FarmerHistoryAdvanceItem[];
  summary: {
    totalGiven: string;
    totalRepaid: string;
    remainingOutstanding: string;
  };
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

const typeBadge = (type: FarmerHistoryAdvanceItem['type']) => {
  switch (type) {
    case 'ISSUED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Advance Issued
        </span>
      );
    case 'MANUAL_REPAYMENT':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Manual Repayment
        </span>
      );
    case 'BILL_SETTLEMENT_RECOVERY':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0052cc] border border-blue-200">
          Bill Recovery
        </span>
      );
  }
};

export const AdvanceHistory: React.FC<AdvanceHistoryProps> = ({ items, summary }) => {
  return (
    <div className="light-panel rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-rose-600" />
          <h4 className="text-sm font-bold text-gray-900">Advance Ledger & History</h4>
          <span className="text-xs text-gray-500">({items.length} transactions)</span>
        </div>
        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
          <span>
            Given: <strong className="text-gray-900">{formatInr(summary.totalGiven)}</strong>
          </span>
          <span>
            Repaid: <strong className="text-emerald-700">{formatInr(summary.totalRepaid)}</strong>
          </span>
          <span>
            Balance: <strong className="text-rose-700">{formatInr(summary.remainingOutstanding)}</strong>
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">
          No advance transactions recorded for this farmer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Advance #</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Advance Balance</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-rose-50/20">
                  <td className="py-2.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700">
                    {row.advanceNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {typeBadge(row.type)}
                      {row.settlementNumber && (
                        <span className="text-[10px] text-gray-500">({row.settlementNumber})</span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-semibold ${
                      row.type === 'ISSUED' ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {row.type === 'ISSUED' ? '+' : '-'}
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                    {formatInr(row.remainingBalance)}
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 max-w-xs truncate">
                    {row.notes || '—'}
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

