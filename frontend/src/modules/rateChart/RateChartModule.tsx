import React, { useState } from 'react';
import {
  Plus,
  Download,
  Search,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useRateChartsQuery, useRateChartMutations } from './rateChart.queries';
import { rateChartApi } from './rateChart.api';
import { RateChartTable } from './components/RateChartTable';
import { CreateRateChartModal } from './components/CreateRateChartModal';
import { ExcelMatrixImportModal } from './components/ExcelMatrixImportModal';
import { ActivationConflictModal } from './components/ActivationConflictModal';
import { RatePreviewModal } from './components/RatePreviewModal';
import { RateChartHistoryModal } from './components/RateChartHistoryModal';
import type {
  RateChart,
  MilkType,
  RateCalculationMethod,
  RateChartStatus,
  ActivationConflict,
} from './rateChart.types';

export const RateChartModule: React.FC = () => {
  // Query Filter States
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMilkType, setFilterMilkType] = useState<MilkType | ''>('');
  const [filterMethod, setFilterMethod] = useState<RateCalculationMethod | ''>('');
  const [filterStatus, setFilterStatus] = useState<RateChartStatus | ''>('');

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [importTargetChart, setImportTargetChart] = useState<RateChart | null>(null);
  const [previewTargetChart, setPreviewTargetChart] = useState<RateChart | null>(null);
  const [historyTargetChart, setHistoryTargetChart] = useState<RateChart | null>(null);

  // Activation Conflict State (HTTP 409)
  const [conflictModalData, setConflictModalData] = useState<{
    isOpen: boolean;
    chartId: string;
    chartName: string;
    conflicts: ActivationConflict[];
  }>({
    isOpen: false,
    chartId: '',
    chartName: '',
    conflicts: [],
  });

  // Alerts
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, error: queryError, refetch } = useRateChartsQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    milkType: filterMilkType || undefined,
    method: filterMethod || undefined,
    status: filterStatus || undefined,
  });

  const { activateChart, deactivateChart, deleteChart } = useRateChartMutations();

  // Handlers
  const handleActivate = async (chart: RateChart) => {
    setFeedbackMsg(null);
    try {
      await activateChart.mutateAsync({ id: chart.id, confirmReplace: false });
      setFeedbackMsg({ type: 'success', text: `Rate chart "${chart.name}" activated successfully!` });
      refetch();
    } catch (err: any) {
      if (err.statusCode === 409 || err.status === 409) {
        // Show conflict resolution modal
        const rawConflicts = err.errors || err.data?.conflicts || [];
        const mappedConflicts: ActivationConflict[] =
          rawConflicts.length > 0
            ? rawConflicts.map((c: any) => ({
                chartId: c.id || c.chartId || 'conflict',
                name: c.name || 'Existing Active Chart',
                effectiveFrom: c.effectiveFrom || chart.effectiveFrom,
                effectiveTo: c.effectiveTo ?? null,
                message: c.message,
              }))
            : [
                {
                  chartId: 'conflict',
                  name: 'Existing Active Chart',
                  effectiveFrom: chart.effectiveFrom,
                  effectiveTo: null,
                  message: err.message,
                },
              ];

        setConflictModalData({
          isOpen: true,
          chartId: chart.id,
          chartName: chart.name,
          conflicts: mappedConflicts,
        });
      } else {
        setFeedbackMsg({ type: 'error', text: err.message || 'Failed to activate chart.' });
      }
    }
  };

  const handleConfirmReplace = async (chartId: string) => {
    try {
      await activateChart.mutateAsync({ id: chartId, confirmReplace: true });
      setConflictModalData({ isOpen: false, chartId: '', chartName: '', conflicts: [] });
      setFeedbackMsg({
        type: 'success',
        text: 'Previous active chart shortened and new chart activated successfully!',
      });
      refetch();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Replacement activation failed.' });
    }
  };

  const handleDeactivate = async (chart: RateChart) => {
    if (!confirm(`Are you sure you want to deactivate "${chart.name}"?`)) return;
    setFeedbackMsg(null);
    try {
      await deactivateChart.mutateAsync(chart.id);
      setFeedbackMsg({ type: 'success', text: `Chart "${chart.name}" deactivated.` });
      refetch();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to deactivate chart.' });
    }
  };

  const handleDelete = async (chart: RateChart) => {
    if (!confirm(`Are you sure you want to permanently delete draft chart "${chart.name}"?`)) return;
    setFeedbackMsg(null);
    try {
      await deleteChart.mutateAsync(chart.id);
      setFeedbackMsg({ type: 'success', text: 'Draft chart deleted.' });
      refetch();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Cannot delete rate chart.' });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await rateChartApi.downloadTemplate();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to download Excel template.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#091e42] tracking-tight">Rate Chart Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, preview, and activate milk rate charts using FAT/SNF Excel tables or Base + Differential formulas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-gray-200"
            title="Download blank Excel Matrix Template"
          >
            <Download className="w-3.5 h-3.5 text-gray-700" />
            <span>Excel Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Rate Chart</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-2xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="font-bold hover:opacity-75 cursor-pointer ml-4 text-base leading-none px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chart name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full light-input rounded-xl text-xs py-2 pl-9 pr-3"
            />
          </div>

          {/* Milk Type Filter */}
          <div>
            <select
              value={filterMilkType}
              onChange={(e) => setFilterMilkType(e.target.value as any)}
              className="w-full light-input rounded-xl text-xs py-2 px-3 bg-white font-medium"
            >
              <option value="">All Milk Types</option>
              <option value="COW">Cow Milk</option>
              <option value="BUFFALO">Buffalo Milk</option>
              <option value="MIX">Mix Milk</option>
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as any)}
              className="w-full light-input rounded-xl text-xs py-2 px-3 bg-white font-medium"
            >
              <option value="">All Calculation Methods</option>
              <option value="BASE_DIFFERENTIAL">Base + Differential</option>
              <option value="RATE_TABLE">FAT/SNF Table (Excel)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full light-input rounded-xl text-xs py-2 px-3 bg-white font-medium"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Query Error Banner */}
      {isError && (
        <div className="p-3.5 rounded-xl border bg-red-50 border-red-200 text-red-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Failed to load rate charts: {(queryError as any)?.message || 'Unknown error'}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg font-bold hover:bg-red-100 cursor-pointer text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <RateChartTable
          charts={data?.charts || (data as any)?.items || []}
          isLoading={isLoading}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDelete={handleDelete}
          onPreview={(chart) => setPreviewTargetChart(chart)}
          onHistory={(chart) => setHistoryTargetChart(chart)}
        />

        {/* Pagination Bar */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50/70">
            <span>
              Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.totalPages}</strong> ({data.pagination.total} charts)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-semibold cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRateChartModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(createdChart, matrixImported) => {
          refetch();
          if (matrixImported && createdChart) {
            setFeedbackMsg({
              type: 'success',
              text: `Draft "${createdChart.name}" saved with Excel rate matrix. Preview rates or Activate when ready.`,
            });
          } else if (createdChart && createdChart.method === 'RATE_TABLE') {
            setImportTargetChart(createdChart);
            setFeedbackMsg({
              type: 'success',
              text: `Draft "${createdChart.name}" created. Upload and validate your Excel matrix to continue.`,
            });
          } else {
            setFeedbackMsg({ type: 'success', text: 'New draft rate chart created.' });
          }
        }}
      />

      {importTargetChart && (
        <ExcelMatrixImportModal
          isOpen={!!importTargetChart}
          chartId={importTargetChart.id}
          chartName={importTargetChart.name}
          milkType={importTargetChart.milkType}
          onClose={() => setImportTargetChart(null)}
          onSuccess={() => {
            refetch();
            setFeedbackMsg({ type: 'success', text: 'Excel Rate Matrix imported successfully.' });
          }}
        />
      )}

      {conflictModalData.isOpen && (
        <ActivationConflictModal
          isOpen={conflictModalData.isOpen}
          chartId={conflictModalData.chartId}
          chartName={conflictModalData.chartName}
          conflicts={conflictModalData.conflicts}
          onClose={() => setConflictModalData({ isOpen: false, chartId: '', chartName: '', conflicts: [] })}
          onConfirmReplace={handleConfirmReplace}
          isLoading={activateChart.isPending}
        />
      )}

      {previewTargetChart && (
        <RatePreviewModal
          isOpen={!!previewTargetChart}
          chart={previewTargetChart}
          onClose={() => setPreviewTargetChart(null)}
        />
      )}

      {historyTargetChart && (
        <RateChartHistoryModal
          isOpen={!!historyTargetChart}
          chartId={historyTargetChart.id}
          chartName={historyTargetChart.name}
          onClose={() => setHistoryTargetChart(null)}
        />
      )}
    </div>
  );
};
export default RateChartModule;
