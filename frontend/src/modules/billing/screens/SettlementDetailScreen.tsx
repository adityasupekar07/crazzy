import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Milk,
  Package,
  Wallet,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useBillingSettlementStore } from '../../../store';

interface SettlementDetailScreenProps {
  settlementId: string;
  onBack: () => void;
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const SettlementDetailScreen: React.FC<SettlementDetailScreenProps> = ({
  settlementId,
  onBack,
}) => {
  const detail = useBillingSettlementStore((s) => s.settlementDetail);
  const isLoading = useBillingSettlementStore((s) => s.isSettlementDetailLoading);
  const error = useBillingSettlementStore((s) => s.settlementDetailError);
  const fetchSettlementDetail = useBillingSettlementStore((s) => s.fetchSettlementDetail);

  useEffect(() => {
    fetchSettlementDetail(settlementId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settlement History
        </button>
      </div>

      {isLoading ? (
        <div className="light-panel p-10 rounded-xl flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-6 h-6 text-[#0052cc] animate-spin" />
          <span>Loading settlement details...</span>
        </div>
      ) : error ? (
        <div className="light-panel p-6 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Failed to load settlement details:</strong> {error}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchSettlementDetail(settlementId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : !detail ? null : (
        <div className="space-y-5">
          {/* Header & Farmer + Billing Period */}
          <div className="light-panel p-6 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Settlement Details</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Settlement Reference: <strong>{detail.settlementNumber}</strong>
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  detail.status === 'FINALIZED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Status: {detail.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase">
                  <User className="w-3.5 h-3.5 text-[#0052cc]" />
                  <span>Farmer Information</span>
                </div>
                <p className="font-bold text-sm text-gray-900">{detail.farmer.name}</p>
                <p className="text-gray-600">
                  Farmer Code: <strong>#{detail.farmer.code}</strong> | Mobile:{' '}
                  <strong>{detail.farmer.mobile}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase">
                  <Calendar className="w-3.5 h-3.5 text-[#0052cc]" />
                  <span>Billing Period</span>
                </div>
                <p className="font-bold text-sm text-gray-900">
                  {detail.billingPeriod.startDate} to {detail.billingPeriod.endDate}
                </p>
                <p className="text-gray-600">
                  Cycle Type: <strong>{detail.billingPeriod.cycleType}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Milk Collection History (Historical Snapshot) */}
          <div className="light-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Milk className="w-4 h-4 text-[#0052cc]" />
                <h4 className="text-sm font-bold text-gray-900">Milk Collection History</h4>
              </div>
              <span className="text-xs text-gray-600">
                Total: <strong>{detail.summary.totalLitres} L</strong> |{' '}
                <strong className="text-[#0052cc]">{formatInr(detail.summary.grossMilkAmount)}</strong>
              </span>
            </div>
            {detail.milkCollections.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No milk entries recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-3">Shift</th>
                      <th className="py-2.5 px-3 text-right">Litres</th>
                      <th className="py-2.5 px-3 text-right">FAT</th>
                      <th className="py-2.5 px-3 text-right">SNF</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {detail.milkCollections.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 px-4 font-medium">{m.date}</td>
                        <td className="py-2.5 px-3">{m.shift}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{m.litres}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{m.fat}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{m.snf}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatInr(m.rate)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900">
                          {formatInr(m.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Feed Deduction Details */}
          <div className="light-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-gray-900">Feed Deduction Details</h4>
              </div>
              <span className="text-xs text-gray-600">
                Deducted: <strong className="text-rose-700">{formatInr(detail.summary.feedDeducted)}</strong>
              </span>
            </div>
            {detail.feedAllocations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No feed deductions applied in this settlement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="py-2.5 px-4">Feed</th>
                      <th className="py-2.5 px-3">Sale Date</th>
                      <th className="py-2.5 px-3 text-right">Original Amount</th>
                      <th className="py-2.5 px-3 text-right">Previous Payments</th>
                      <th className="py-2.5 px-3 text-right">Deducted</th>
                      <th className="py-2.5 px-4 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {detail.feedAllocations.map((f) => (
                      <tr key={f.id}>
                        <td className="py-2.5 px-4 font-medium text-gray-900">{f.foodName}</td>
                        <td className="py-2.5 px-3">{f.saleDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatInr(f.originalAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          {formatInr(f.previousPayments)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                          -{formatInr(f.deductedAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                          {formatInr(f.remainingAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Advance Deduction Details */}
          <div className="light-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-bold text-gray-900">Advance Deduction Details</h4>
              </div>
              <span className="text-xs text-gray-600">
                Deducted: <strong className="text-rose-700">{formatInr(detail.summary.advanceDeducted)}</strong>
              </span>
            </div>
            {detail.advanceAllocations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No advance deductions applied in this settlement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="py-2.5 px-4">Advance #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Original Advance</th>
                      <th className="py-2.5 px-3 text-right">External Repayments</th>
                      <th className="py-2.5 px-3 text-right">Deducted</th>
                      <th className="py-2.5 px-4 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {detail.advanceAllocations.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2.5 px-4 font-mono text-[11px]">{a.advanceNumber}</td>
                        <td className="py-2.5 px-3">{a.givenDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatInr(a.originalAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          {formatInr(a.externalRepayments)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                          -{formatInr(a.deductedAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800">
                          {formatInr(a.remainingAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Settlement Summary & Finalization Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="light-panel p-5 rounded-xl space-y-2.5 text-xs">
              <h4 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-200">
                Settlement Summary
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Milk Amount</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatInr(detail.summary.grossMilkAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Previous Feed Outstanding</span>
                <span className="font-mono">{formatInr(detail.summary.previousFeedOutstanding)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Feed Sales</span>
                <span className="font-mono">{formatInr(detail.summary.currentFeedSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Feed Outstanding</span>
                <span className="font-mono">{formatInr(detail.summary.totalFeedOutstanding)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Feed Deduction</span>
                <span className="font-mono">-{formatInr(detail.summary.feedDeducted)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Remaining Feed (Carry-Forward)</span>
                <span className="font-mono">{formatInr(detail.summary.remainingFeed)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span className="text-gray-600">Total Advance Outstanding</span>
                <span className="font-mono">{formatInr(detail.summary.totalAdvanceOutstanding)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Advance Deduction</span>
                <span className="font-mono">-{formatInr(detail.summary.advanceDeducted)}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Remaining Advance (Carry-Forward)</span>
                <span className="font-mono">{formatInr(detail.summary.remainingAdvance)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-rose-700">
                <span>Total Deductions</span>
                <span className="font-mono">-{formatInr(detail.summary.totalDeductions)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 text-sm font-extrabold text-emerald-700">
                <span>FINAL PAYABLE</span>
                <span className="font-mono">{formatInr(detail.summary.netPayable)}</span>
              </div>
            </div>

            <div className="light-panel p-5 rounded-xl space-y-2.5 text-xs self-start">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-900">Finalization Information</h4>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement Reference</span>
                <span className="font-mono font-bold text-gray-900">{detail.settlementNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement ID</span>
                <span className="font-mono text-gray-700">{detail.settlementId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Finalized At</span>
                <span className="font-medium text-gray-900">
                  {new Date(detail.finalizedAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Finalized By</span>
                <span className="font-mono text-gray-700">{detail.finalizedBy || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement Status</span>
                <span className="font-bold text-emerald-700">{detail.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

