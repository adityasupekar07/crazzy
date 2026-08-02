import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Info, Layers, FileSpreadsheet } from 'lucide-react';
import type { RateChartFormValues } from '../schemas/rateChart.schema';
import type { MilkType } from '../types/rateChart.types';

export const BasicInformationForm: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RateChartFormValues>();

  const selectedMilkType = watch('milkType');
  const selectedChartType = watch('chartType');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#091e42] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#deebff] text-[#0052cc] text-xs font-bold flex items-center justify-center border border-blue-200">
              1
            </span>
            Basic Information
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Specify the chart identifier, milk category, format, and baseline purchasing rate per litre.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart Name */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Chart Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Standard Cow Rate Chart - Monsoon 2026"
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-[#091e42] placeholder-gray-400 focus:outline-none focus:border-[#0052cc] transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Milk Type Selection Cards */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Milk Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'COW', label: 'Cow Milk', sub: 'गाय' },
              { type: 'BUFFALO', label: 'Buffalo Milk', sub: 'म्हैस' },
              { type: 'MIX', label: 'Mix Milk', sub: 'मिश्र' },
            ].map(({ type, label, sub }) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('milkType', type as MilkType)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedMilkType === type
                    ? 'bg-[#deebff] border-[#0052cc] text-[#0747a6] shadow-sm font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-xs">{label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Format Mode (POINT vs EXCEL) */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Configuration Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('chartType', 'POINT')}
              className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                selectedChartType === 'POINT'
                  ? 'bg-[#deebff] border-[#0052cc] text-[#0747a6] font-bold shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Layers className="w-4 h-4 text-[#0052cc]" />
              <div className="text-left">
                <div className="text-xs font-bold">Point Formula</div>
                <div className="text-[10px] text-gray-500">FAT/SNF Step Table</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue('chartType', 'EXCEL')}
              className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                selectedChartType === 'EXCEL'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <div className="text-left">
                <div className="text-xs font-bold">Excel Matrix</div>
                <div className="text-[10px] text-gray-500">Import Excel Sheet</div>
              </div>
            </button>
          </div>
        </div>

        {/* Rate Method */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Rate Method <span className="text-red-500">*</span>
          </label>
          <select
            {...register('method')}
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-[#091e42] focus:outline-none focus:border-[#0052cc] transition-colors"
          >
            <option value="FAT_SNF">FAT + SNF Both Increments</option>
            <option value="FAT_ONLY">FAT Only (SNF Ignored)</option>
            <option value="FIXED">Fixed Flat Rate (No Increments)</option>
          </select>
        </div>

        {/* Base Rate */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Baseline Rate (₹ per Litre) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              step="0.1"
              {...register('baseRate', { valueAsNumber: true })}
              placeholder="38.50"
              className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-4 py-2.5 text-base font-bold text-[#0052cc] focus:outline-none focus:border-[#0052cc] transition-colors"
            />
          </div>
          {errors.baseRate && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.baseRate.message}</p>
          )}
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            Standard rate paid for baseline quality milk (e.g. FAT 3.5%, SNF 8.5%).
          </p>
        </div>
      </div>
    </div>
  );
};
