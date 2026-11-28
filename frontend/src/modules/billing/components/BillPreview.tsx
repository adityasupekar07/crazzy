import React from 'react';
import { FileCheck2, CheckCircle2, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { SettlementSummary } from './SettlementSummary';
import type { BillingPreviewResponse } from '../billing.types';

interface BillPreviewProps {
  preview: BillingPreviewResponse;
  canFinalize: boolean;
  isFinalizing: boolean;
  finalizeError: string | null;
  onFinalize: () => void;
}

export const BillPreview: React.FC<BillPreviewProps> = ({
  preview,
  canFinalize,
  isFinalizing,
  finalizeError,
  onFinalize,
}) => {
  return (
    <div className="light-panel p-6 rounded-xl space-y-5 border-2 border-[#0052cc]/20">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052cc] flex items-center justify-center border border-blue-200">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Bill Settlement Preview — #{preview.farmer.code} {preview.farmer.name}
            </h3>
            <p className="text-xs text-gray-500">
              Period: <strong>{preview.billingPeriod.startDate}</strong> to{' '}
              <strong>{preview.billingPeriod.endDate}</strong> ({preview.billingPeriod.cycleType})
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-gray-200 text-[11px] text-gray-600 font-mono"
          title={`Preview ID: ${preview.previewId} | Fingerprint: ${preview.fingerprint}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Preview #{preview.previewId.slice(0, 8)}</span>
        </div>
      </div>

      <SettlementSummary preview={preview} />

      {finalizeError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex items-center gap-2.5 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong>Finalization failed:</strong> {finalizeError}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Preview is read-only until you click Finalize Settlement.
        </p>

        <button
          type="button"
          disabled={!canFinalize || isFinalizing}
          onClick={onFinalize}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white transition shadow-sm cursor-pointer"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finalizing Settlement...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Finalize Settlement
            </>
          )}
        </button>
      </div>
    </div>
  );
};
