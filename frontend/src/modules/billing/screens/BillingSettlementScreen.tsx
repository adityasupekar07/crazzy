import React from 'react';
import { Calculator, History, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  useBillingSettlementStore,
  selectCanFetchHistory,
  selectCanCalculatePreview,
  selectIsHistoryValid,
} from '../../../store';
import { BillingPeriodSelector } from '../components/BillingPeriodSelector';
import { FarmerSelector } from '../components/FarmerSelector';
import { FarmerHistory } from '../components/FarmerHistory';
import { BillPreview } from '../components/BillPreview';

export const BillingSettlementScreen: React.FC = () => {
  const farmerHistory = useBillingSettlementStore((s) => s.farmerHistory);
  const billPreview = useBillingSettlementStore((s) => s.billPreview);
  const isHistoryLoading = useBillingSettlementStore((s) => s.isHistoryLoading);
  const isPreviewLoading = useBillingSettlementStore((s) => s.isPreviewLoading);
  const historyError = useBillingSettlementStore((s) => s.historyError);
  const previewError = useBillingSettlementStore((s) => s.previewError);

  const fetchFarmerHistory = useBillingSettlementStore((s) => s.fetchFarmerHistory);
  const calculateBillPreview = useBillingSettlementStore((s) => s.calculateBillPreview);

  const canFetchHistory = useBillingSettlementStore(selectCanFetchHistory);
  const canCalculatePreview = useBillingSettlementStore(selectCanCalculatePreview);
  const isHistoryValid = useBillingSettlementStore(selectIsHistoryValid);

  return (
    <div className="space-y-6">
      {/* 1. Billing Settlement Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#091e42]">Billing Settlement</h2>
          <p className="text-xs text-gray-500">
            Select a payment cycle and farmer, inspect history, and calculate a read-only bill preview.
          </p>
        </div>
      </div>

      {/* 2 & 3. Payment Cycle Selector + Farmer Selector */}
      <div className="light-panel p-6 rounded-xl space-y-5">
        <BillingPeriodSelector />

        <div className="pt-4 border-t border-gray-200 space-y-4">
          <FarmerSelector />

          {/* 4. Get Farmer History Button */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canFetchHistory}
              onClick={() => fetchFarmerHistory()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              {isHistoryLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading History...
                </>
              ) : (
                <>
                  <History className="w-4 h-4" />
                  Get Farmer History
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5 & 6. Farmer Financial Summary + Milk, Feed, and Advance History */}
      <FarmerHistory
        history={isHistoryValid ? farmerHistory : null}
        isLoading={isHistoryLoading}
        error={historyError}
        onRetry={() => fetchFarmerHistory()}
      />

      {/* 7. Calculate Bill Preview Button */}
      {isHistoryValid && !isHistoryLoading && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canCalculatePreview}
            onClick={() => calculateBillPreview()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            {isPreviewLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating Preview...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Calculate Bill Preview
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview Error State (preserves farmer, cycle, and loaded history) */}
      {previewError && !isPreviewLoading && (
        <div className="light-panel p-5 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <strong>Failed to calculate bill preview:</strong> {previewError}
            </div>
          </div>
          <button
            type="button"
            onClick={() => calculateBillPreview()}
            disabled={!canCalculatePreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Preview
          </button>
        </div>
      )}

      {/* 8 & 9. Bill Preview + Deduction Breakdown + Disabled Finalize Settlement */}
      {billPreview && !isPreviewLoading && isHistoryValid && (
        <BillPreview preview={billPreview} />
      )}
    </div>
  );
};

