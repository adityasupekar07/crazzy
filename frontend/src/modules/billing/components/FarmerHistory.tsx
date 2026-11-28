import React from 'react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { FarmerFinancialSummary } from './FarmerFinancialSummary';
import { MilkCollectionTable } from './MilkCollectionTable';
import { FeedHistoryTable } from './FeedHistoryTable';
import { AdvanceHistoryTable } from './AdvanceHistoryTable';
import type { FarmerHistoryResponse } from '../billing.types';

interface FarmerHistoryProps {
  history: FarmerHistoryResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const FarmerHistory: React.FC<FarmerHistoryProps> = ({
  history,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="light-panel p-8 rounded-xl flex flex-col items-center justify-center gap-2 text-xs text-gray-600">
        <Loader2 className="w-6 h-6 text-[#0052cc] animate-spin" />
        <span className="font-medium">Fetching farmer milk, feed, and advance history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="light-panel p-5 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong>Failed to load farmer history:</strong> {error}
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!history) {
    return null;
  }

  return (
    <div className="space-y-5">
      <FarmerFinancialSummary history={history} />
      <MilkCollectionTable items={history.milkCollections} summary={history.milkSummary} />
      <FeedHistoryTable items={history.feedSales} summary={history.feedSummary} />
      <AdvanceHistoryTable items={history.advanceHistory} summary={history.advanceSummary} />
    </div>
  );
};

