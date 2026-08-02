import React from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import type { MilkType, ChartType, RateChartStatus } from '../types/rateChart.types';

interface RateChartFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  milkType: MilkType | undefined;
  onMilkTypeChange: (val: MilkType | undefined) => void;
  chartType: ChartType | undefined;
  onChartTypeChange: (val: ChartType | undefined) => void;
  status: RateChartStatus;
  onStatusChange: (val: RateChartStatus) => void;
  onReset: () => void;
  onCreateClick: () => void;
}

export const RateChartFilters: React.FC<RateChartFiltersProps> = ({
  search,
  onSearchChange,
  milkType,
  onMilkTypeChange,
  chartType,
  onChartTypeChange,
  status,
  onStatusChange,
  onReset,
  onCreateClick,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rate chart by name..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs text-[#091e42] placeholder-gray-400 focus:outline-none focus:border-[#0052cc] transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Pills */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            {(['ALL', 'ACTIVE', 'DRAFT'] as RateChartStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => onStatusChange(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  status === st
                    ? 'bg-white text-[#0052cc] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-[#091e42]'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st === 'ACTIVE' ? 'Active Only' : 'Drafts Only'}
              </button>
            ))}
          </div>

          {/* Milk Type Filter */}
          <select
            value={milkType || ''}
            onChange={(e) => onMilkTypeChange((e.target.value as MilkType) || undefined)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#0052cc]"
          >
            <option value="">All Milk Types</option>
            <option value="COW">Cow Milk</option>
            <option value="BUFFALO">Buffalo Milk</option>
            <option value="MIX">Mix Milk</option>
          </select>

          {/* Chart Type Filter */}
          <select
            value={chartType || ''}
            onChange={(e) => onChartTypeChange((e.target.value as ChartType) || undefined)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#0052cc]"
          >
            <option value="">All Formats</option>
            <option value="POINT">Point Formula</option>
            <option value="EXCEL">Excel Matrix</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#091e42] hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Primary Create Button */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Rate Chart
          </button>
        </div>
      </div>
    </div>
  );
};
