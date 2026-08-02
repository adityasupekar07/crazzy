import React, { useState } from 'react';
import { useRateCharts, useActiveRateChart, useRateChartMutations } from '../hooks/useRateCharts';
import type { RateChart, MilkType, ChartType, RateChartStatus } from '../types/rateChart.types';
import { ActiveRateChartCard } from '../components/ActiveRateChartCard';
import { RateChartFilters } from '../components/RateChartFilters';
import { RateChartTable } from '../components/RateChartTable';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { CloneModal } from '../components/CloneModal';

interface RateChartListPageProps {
  onNavigateToCreate: () => void;
  onNavigateToEdit: (chartId: string) => void;
}

export const RateChartListPage: React.FC<RateChartListPageProps> = ({
  onNavigateToCreate,
  onNavigateToEdit,
}) => {
  // Active hero card state
  const [activeMilkType, setActiveMilkType] = useState<MilkType>('COW');
  const { data: activeChart, isLoading: isActiveLoading } = useActiveRateChart({
    milkType: activeMilkType,
  });

  // Table filter & pagination state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [milkType, setMilkType] = useState<MilkType | undefined>(undefined);
  const [chartType, setChartType] = useState<ChartType | undefined>(undefined);
  const [status, setStatus] = useState<RateChartStatus>('ALL');

  const { data: paginatedData, isLoading: isListLoading } = useRateCharts({
    page,
    limit: 10,
    search: search || undefined,
    milkType,
    chartType,
    status: status === 'ALL' ? undefined : status,
  });

  // Mutations
  const { activateChart, cloneChart, deleteChart, isCloning, isDeleting } = useRateChartMutations();

  // Dialog state
  const [selectedChartForDelete, setSelectedChartForDelete] = useState<RateChart | null>(null);
  const [selectedChartForClone, setSelectedChartForClone] = useState<RateChart | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleResetFilters = () => {
    setSearch('');
    setMilkType(undefined);
    setChartType(undefined);
    setStatus('ALL');
    setPage(1);
  };

  const handleActivate = async (chart: RateChart) => {
    try {
      await activateChart(chart.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate chart');
    }
  };

  const handleConfirmClone = async () => {
    if (!selectedChartForClone) return;
    try {
      const cloned = await cloneChart(selectedChartForClone.id);
      setSelectedChartForClone(null);
      // Navigate straight to edit cloned draft
      onNavigateToEdit(cloned.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clone chart');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedChartForDelete) return;
    setDeleteErrorMessage(null);
    try {
      await deleteChart(selectedChartForDelete.id);
      setSelectedChartForDelete(null);
    } catch (err: any) {
      setDeleteErrorMessage(
        err.response?.data?.message || 'Failed to delete rate chart. Check if it is referenced in collections.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Rate Chart Management</h1>
          <p className="text-sm text-slate-400">
            Configure milk purchase rates, FAT/SNF formulas, step increments, and bonus/penalty rules.
          </p>
        </div>
      </div>

      {/* Hero Active Chart Summary Card */}
      <ActiveRateChartCard
        activeChart={activeChart}
        isLoading={isActiveLoading}
        selectedMilkType={activeMilkType}
        onMilkTypeChange={setActiveMilkType}
      />

      {/* Search & Filter Controls */}
      <RateChartFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        milkType={milkType}
        onMilkTypeChange={(val) => {
          setMilkType(val);
          setPage(1);
        }}
        chartType={chartType}
        onChartTypeChange={(val) => {
          setChartType(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
        onCreateClick={onNavigateToCreate}
      />

      {/* Main Rate Chart Data Table */}
      <RateChartTable
        charts={paginatedData?.items || []}
        isLoading={isListLoading}
        page={paginatedData?.pagination?.page || page}
        totalPages={paginatedData?.pagination?.totalPages || 1}
        total={paginatedData?.pagination?.total || 0}
        onPageChange={setPage}
        onEdit={(chart) => onNavigateToEdit(chart.id)}
        onClone={(chart) => setSelectedChartForClone(chart)}
        onActivate={handleActivate}
        onDelete={(chart) => setSelectedChartForDelete(chart)}
      />

      {/* Clone Confirmation Modal */}
      <CloneModal
        chart={selectedChartForClone}
        isOpen={!!selectedChartForClone}
        isCloning={isCloning}
        onClose={() => setSelectedChartForClone(null)}
        onConfirm={handleConfirmClone}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        chart={selectedChartForDelete}
        isOpen={!!selectedChartForDelete}
        isDeleting={isDeleting}
        errorMessage={deleteErrorMessage}
        onClose={() => {
          setSelectedChartForDelete(null);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
