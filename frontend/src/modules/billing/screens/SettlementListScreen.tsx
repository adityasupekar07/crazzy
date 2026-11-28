import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
  FileText,
  X,
} from 'lucide-react';
import { QUERY_KEYS } from '../../../queries/keys';
import { billingApi } from '../billing.api';
import { useBillingSettlementStore } from '../../../store';
import type { SettlementStatus } from '../billing.types';

interface SettlementListScreenProps {
  onSelectSettlement: (settlementId: string) => void;
}

const formatInr = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₹${value}`;
};

export const SettlementListScreen: React.FC<SettlementListScreenProps> = ({
  onSelectSettlement,
}) => {
  const settlementList = useBillingSettlementStore((s) => s.settlementList);
  const pagination = useBillingSettlementStore((s) => s.settlementPagination);
  const filters = useBillingSettlementStore((s) => s.settlementFilters);
  const isLoading = useBillingSettlementStore((s) => s.isSettlementListLoading);
  const error = useBillingSettlementStore((s) => s.settlementListError);
  const setFilters = useBillingSettlementStore((s) => s.setSettlementFilters);
  const fetchSettlements = useBillingSettlementStore((s) => s.fetchSettlements);

  const [refInput, setRefInput] = useState(filters.settlementReference ?? '');

  // Load farmers for the farmer filter dropdown
  const { data: farmersData } = useQuery({
    queryKey: QUERY_KEYS.billing.farmers({ page: 1, limit: 100 }),
    queryFn: () => billingApi.getFarmers({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Initial load & reload whenever filters change
  useEffect(() => {
    fetchSettlements(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.startDate,
    filters.endDate,
    filters.farmerId,
    filters.status,
    filters.settlementReference,
    filters.page,
    filters.limit,
  ]);

  // Debounce settlement reference search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = refInput.trim() || undefined;
      if (trimmed !== filters.settlementReference) {
        setFilters({ settlementReference: trimmed, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refInput]);

  const handleClearFilters = () => {
    setRefInput('');
    setFilters({
      startDate: undefined,
      endDate: undefined,
      farmerId: undefined,
      status: undefined,
      settlementReference: undefined,
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.startDate ||
      filters.endDate ||
      filters.farmerId ||
      filters.status ||
      filters.settlementReference
  );

  return (
    <div className="space-y-5">
      {/* Filters Panel (4 required filters: Billing period, Farmer, Status, Settlement reference) */}
      <div className="light-panel p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#0052cc]" />
            <span>Filter Settlements</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1a. Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Period Start
            </label>
            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={(e) =>
                setFilters({ startDate: e.target.value || undefined, page: 1 })
              }
              className="w-full light-input rounded-lg text-xs py-2 px-2.5 bg-white"
            />
          </div>

          {/* 1b. End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Period End
            </label>
            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={(e) =>
                setFilters({ endDate: e.target.value || undefined, page: 1 })
              }
              className="w-full light-input rounded-lg text-xs py-2 px-2.5 bg-white"
            />
          </div>

          {/* 2. Farmer */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Farmer
            </label>
            <select
              value={filters.farmerId ?? ''}
              onChange={(e) =>
                setFilters({ farmerId: e.target.value || undefined, page: 1 })
              }
              className="w-full light-input rounded-lg text-xs py-2 px-2.5 bg-white"
            >
              <option value="">All Farmers</option>
              {(farmersData?.farmers ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  #{f.code} {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Settlement Status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Status
            </label>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                setFilters({
                  status: (e.target.value || undefined) as SettlementStatus | undefined,
                  page: 1,
                })
              }
              className="w-full light-input rounded-lg text-xs py-2 px-2.5 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="FINALIZED">FINALIZED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* 4. Settlement Reference */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Settlement Reference
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="e.g. SET-..."
                className="w-full light-input rounded-lg text-xs py-2 pl-8 pr-2.5 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table / Loading / Empty / Error */}
      <div className="light-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-6 h-6 text-[#0052cc] animate-spin" />
            <span>Loading settlement history...</span>
          </div>
        ) : error ? (
          <div className="p-6 flex flex-wrap items-center justify-between gap-3 bg-rose-50/70">
            <div className="flex items-center gap-2 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Failed to load settlements:</strong> {error}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchSettlements(filters)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : settlementList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-semibold text-gray-600">No settlements found</p>
            <p className="text-[11px] text-gray-400">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Finalized settlements will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-3">Farmer</th>
                    <th className="py-3 px-3">Period</th>
                    <th className="py-3 px-3 text-right">Milk Amount</th>
                    <th className="py-3 px-3 text-right">Deductions</th>
                    <th className="py-3 px-3 text-right">Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {settlementList.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onSelectSettlement(item.id)}
                      className="hover:bg-blue-50/50 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#0052cc] whitespace-nowrap">
                        {item.settlementNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        #{item.farmer.code} {item.farmer.name}
                      </td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {item.billingPeriod.startDate} to {item.billingPeriod.endDate}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-800">
                        {formatInr(item.milkAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-700">
                        -{formatInr(item.totalDeductions)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatInr(item.netPayable)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'FINALIZED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-slate-50/70 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Page <strong>{pagination.page}</strong> of{' '}
                  <strong>{pagination.totalPages}</strong> ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ page: pagination.page - 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilters({ page: pagination.page + 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

