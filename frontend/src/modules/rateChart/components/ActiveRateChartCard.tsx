import React from 'react';
import { ShieldCheck, Zap, Layers, FileSpreadsheet } from 'lucide-react';
import type { RateChart, MilkType } from '../types/rateChart.types';
import { rateChartService } from '../services/rateChart.service';

interface ActiveRateChartCardProps {
  activeChart: RateChart | null | undefined;
  isLoading: boolean;
  selectedMilkType: MilkType;
  onMilkTypeChange: (milkType: MilkType) => void;
}

export const ActiveRateChartCard: React.FC<ActiveRateChartCardProps> = ({
  activeChart,
  isLoading,
  selectedMilkType,
  onMilkTypeChange,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#deebff] text-[#0052cc] flex items-center justify-center border border-blue-200 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#091e42]">Active Rate Chart</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                Live In Collection
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Currently applied rate calculation matrix for milk collection entries
            </p>
          </div>
        </div>

        {/* Milk Type Switcher Pills */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          {(['COW', 'BUFFALO', 'MIX'] as MilkType[]).map((type) => (
            <button
              key={type}
              onClick={() => onMilkTypeChange(type)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedMilkType === type
                  ? 'bg-[#0052cc] text-white shadow-sm font-bold'
                  : 'text-gray-600 hover:text-[#091e42]'
              }`}
            >
              {type === 'COW' ? 'Cow Milk' : type === 'BUFFALO' ? 'Buffalo Milk' : 'Mix Milk'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-3 py-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-1/2" />
        </div>
      ) : activeChart ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Chart Name
            </span>
            <p className="text-base font-bold text-[#091e42] truncate">{activeChart.name}</p>
            <span className="text-xs text-[#0052cc] mt-1 font-semibold block">
              {rateChartService.formatMilkTypeLabel(activeChart.milkType)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Base Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#0052cc]">
                ₹{activeChart.baseRate.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500">/ Litre</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Method: {rateChartService.formatRateMethodLabel(activeChart.method)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Structure Type
            </span>
            <div className="flex items-center gap-2 mt-1">
              {activeChart.chartType === 'EXCEL' ? (
                <>
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">Excel Matrix Grid</span>
                </>
              ) : (
                <>
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Point Formula Steps</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              {activeChart.fatSteps.length} FAT Steps • {activeChart.snfSteps.length} SNF Steps • {activeChart.rules.length} Rules
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Effective Since
            </span>
            <p className="text-sm font-semibold text-gray-800">
              {activeChart.effectiveFrom
                ? new Date(activeChart.effectiveFrom).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Now'}
            </p>
            <div className="flex items-center gap-1 text-xs text-green-700 font-bold mt-2">
              <Zap className="w-3.5 h-3.5 fill-green-600 text-green-600" /> Ready for Collection
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-800 text-xs font-bold">
            No active rate chart configured for {rateChartService.formatMilkTypeLabel(selectedMilkType)}.
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Please activate a draft chart from the table below or create a new rate chart.
          </p>
        </div>
      )}
    </div>
  );
};
