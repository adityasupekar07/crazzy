import React from 'react';
import {
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  Calendar,
  Lock,
} from 'lucide-react';
import type { RateChart } from '../types/rateChart.types';
import { rateChartService } from '../services/rateChart.service';

interface RateChartTableProps {
  charts: RateChart[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onEdit: (chart: RateChart) => void;
  onClone: (chart: RateChart) => void;
  onActivate: (chart: RateChart) => void;
  onDelete: (chart: RateChart) => void;
}

export const RateChartTable: React.FC<RateChartTableProps> = ({
  charts,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onClone,
  onActivate,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="animate-spin w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 text-xs font-medium">Loading rate charts...</p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#091e42] mb-1">No Rate Charts Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          No rate charts match your active search or filters. Adjust search keywords or create a new chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              <th className="py-3 px-5">Chart Name</th>
              <th className="py-3 px-5">Milk Type</th>
              <th className="py-3 px-5">Type & Method</th>
              <th className="py-3 px-5">Base Rate</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Created Date</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {charts.map((chart) => (
              <tr key={chart.id} className="hover:bg-gray-50/80 transition-colors group">
                {/* Chart Name */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        chart.chartType === 'EXCEL'
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'bg-blue-50 text-[#0052cc] border border-blue-200'
                      }`}
                    >
                      {chart.chartType === 'EXCEL' ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#091e42] group-hover:text-[#0052cc] transition-colors">
                        {chart.name}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {chart.fatSteps?.length || 0} FAT Steps • {chart.snfSteps?.length || 0} SNF Steps
                      </span>
                    </div>
                  </div>
                </td>

                {/* Milk Type */}
                <td className="py-3.5 px-5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {rateChartService.formatMilkTypeLabel(chart.milkType)}
                  </span>
                </td>

                {/* Type & Method */}
                <td className="py-3.5 px-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#091e42]">
                      {rateChartService.formatRateMethodLabel(chart.method)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {chart.chartType === 'EXCEL' ? 'Excel Import' : 'Point Increment'}
                    </span>
                  </div>
                </td>

                {/* Base Rate */}
                <td className="py-3.5 px-5">
                  <span className="text-sm font-black text-[#0052cc]">
                    ₹{chart.baseRate.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-400"> /L</span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-5">
                  {chart.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                      DRAFT
                    </span>
                  )}
                </td>

                {/* Created Date */}
                <td className="py-3.5 px-5 text-gray-500 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(chart.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Activate Button */}
                    {!chart.isActive && (
                      <button
                        onClick={() => onActivate(chart)}
                        title="Activate Chart"
                        className="px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activate
                      </button>
                    )}

                    {/* Edit Button */}
                    {chart.isActive ? (
                      <button
                        onClick={() => onEdit(chart)}
                        title="Active charts are locked. Click to view/clone."
                        className="p-1.5 rounded bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onEdit(chart)}
                        title="Edit Draft"
                        className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-[#0052cc] border border-blue-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Clone Button */}
                    <button
                      onClick={() => onClone(chart)}
                      title="Clone Chart"
                      className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button (Only for DRAFT) */}
                    {!chart.isActive && (
                      <button
                        onClick={() => onDelete(chart)}
                        title="Delete Draft"
                        className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500">
          Showing page <span className="font-bold text-[#091e42]">{page}</span> of{' '}
          <span className="font-bold text-[#091e42]">{totalPages || 1}</span> ({total} total charts)
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:text-[#091e42] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-gray-200 rounded text-gray-700">
            {page} / {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:text-[#091e42] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
