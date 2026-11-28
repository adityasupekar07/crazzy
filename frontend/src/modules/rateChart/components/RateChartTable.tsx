import React from 'react';
import {
  FileSpreadsheet,
  Calculator,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Trash2,
  Eye,
  History as HistoryIcon,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { RateChart } from '../rateChart.types';

interface RateChartTableProps {
  charts: RateChart[];
  isLoading: boolean;
  onActivate: (chart: RateChart) => void;
  onDeactivate: (chart: RateChart) => void;
  onDelete: (chart: RateChart) => void;
  onPreview: (chart: RateChart) => void;
  onHistory: (chart: RateChart) => void;
}

const formatDisplayDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const RateChartTable: React.FC<RateChartTableProps> = ({
  charts,
  isLoading,
  onActivate,
  onDeactivate,
  onDelete,
  onPreview,
  onHistory,
}) => {
  if (isLoading) {
    return (
      <div className="py-14 text-center text-xs text-gray-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
        <p className="font-semibold">Loading rate charts...</p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="py-14 text-center text-gray-500 px-4">
        <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-300 mb-2.5" />
        <p className="font-bold text-sm text-gray-700">No Rate Charts Found</p>
        <p className="text-xs text-gray-500 mt-1">
          Click &ldquo;Create Rate Chart&rdquo; above to set up your first milk pricing chart.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
            <th className="py-2.5 px-4">Chart Name</th>
            <th className="py-2.5 px-3">Milk Type</th>
            <th className="py-2.5 px-3">Method</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3">Effective Period</th>
            <th className="py-2.5 px-3">Rate Summary</th>
            <th className="py-2.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          {charts.map((chart) => {
            const isDraft = chart.status === 'DRAFT';
            const isActive = chart.status === 'ACTIVE';

            const effectiveFromStr = formatDisplayDate(chart.effectiveFrom);
            const effectiveToStr = chart.effectiveTo
              ? formatDisplayDate(chart.effectiveTo)
              : 'Ongoing';

            return (
              <tr
                key={chart.id}
                className={`transition ${
                  isActive
                    ? 'bg-emerald-50/35 hover:bg-emerald-50/60'
                    : 'hover:bg-blue-50/30'
                }`}
              >
                {/* Chart Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        chart.method === 'RATE_TABLE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {chart.method === 'RATE_TABLE' ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <Calculator className="w-4 h-4" />
                      )}
                    </div>
                    <span className="font-semibold text-xs text-[#091e42]">{chart.name}</span>
                  </div>
                </td>

                {/* Milk Type */}
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide inline-block ${
                      chart.milkType === 'COW'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : chart.milkType === 'BUFFALO'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                  >
                    {chart.milkType}
                  </span>
                </td>

                {/* Method */}
                <td className="py-3 px-3 font-medium text-gray-700 whitespace-nowrap">
                  {chart.method === 'RATE_TABLE' ? 'FAT/SNF Table' : 'Base + Differential'}
                </td>

                {/* Status */}
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      chart.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : chart.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : chart.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {chart.status === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                    {chart.status}
                  </span>
                </td>

                {/* Effective Period */}
                <td className="py-3 px-3 text-xs text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {effectiveFromStr} – {effectiveToStr}
                    </span>
                  </div>
                </td>

                {/* Configuration / Rate Summary */}
                <td className="py-3 px-3 text-xs text-gray-700">
                  {chart.method === 'RATE_TABLE' ? (
                    <span>
                      {chart.totalCells != null && chart.totalCells > 0 ? (
                        <strong className="text-gray-900 font-semibold">{chart.totalCells} rate cells</strong>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Excel not uploaded
                        </span>
                      )}
                    </span>
                  ) : chart.differential ? (
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#091e42]">
                        Base ₹{chart.differential.baseRate}/L
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {chart.differential.baseFat}% FAT · {chart.differential.baseSnf}% SNF
                      </div>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {/* Preview Rate */}
                    <button
                      onClick={() => onPreview(chart)}
                      title="Preview Rate Calculation"
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Version History */}
                    <button
                      onClick={() => onHistory(chart)}
                      title="View Chart History"
                      className="px-2 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <HistoryIcon className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">History</span>
                    </button>

                    {/* Activate (if DRAFT) */}
                    {isDraft && (
                      <button
                        onClick={() => onActivate(chart)}
                        title="Activate Rate Chart"
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </button>
                    )}

                    {/* Deactivate (if ACTIVE) */}
                    {isActive && (
                      <button
                        onClick={() => onDeactivate(chart)}
                        title="Deactivate Rate Chart"
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </button>
                    )}

                    {/* Delete (if DRAFT) */}
                    {isDraft && (
                      <button
                        onClick={() => onDelete(chart)}
                        title="Delete Draft Chart"
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
