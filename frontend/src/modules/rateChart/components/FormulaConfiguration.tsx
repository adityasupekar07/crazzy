import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Calculator, CheckCircle2 } from 'lucide-react';
import type { RateChartFormValues } from '../schemas/rateChart.schema';

export const FormulaConfiguration: React.FC = () => {
  const { watch } = useFormContext<RateChartFormValues>();
  const method = watch('method');
  const baseRate = watch('baseRate') || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#091e42] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#deebff] text-[#0052cc] text-xs font-bold flex items-center justify-center border border-blue-200">
              2
            </span>
            Rate Calculation Formula Guide
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Visual breakdown of how rate per litre will be computed for collection entries.
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052cc] flex items-center justify-center">
          <Calculator className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Active Calculation Logic
          </span>
          <span className="text-xs font-bold text-[#0052cc] bg-[#deebff] px-2.5 py-0.5 rounded border border-blue-200">
            {method === 'FAT_SNF' ? 'FAT + SNF Formula' : method === 'FAT_ONLY' ? 'FAT Only Formula' : 'Flat Fixed Formula'}
          </span>
        </div>

        {method === 'FAT_SNF' && (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="p-2.5 bg-white rounded border border-gray-200 font-mono text-[#0052cc] font-bold text-xs">
              Rate = Base Rate (₹{baseRate.toFixed(2)}) + FAT Increment + SNF Increment ± Bonus/Penalty
            </div>
            <ul className="space-y-1.5 pt-1 text-gray-500">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                FAT increments add or subtract based on FAT % steps above/below baseline.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                SNF increments add or subtract based on SNF % steps above/below baseline.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Bonus/Penalty rules apply on top of step totals for specific quality thresholds.
              </li>
            </ul>
          </div>
        )}

        {method === 'FAT_ONLY' && (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="p-2.5 bg-white rounded border border-gray-200 font-mono text-[#0052cc] font-bold text-xs">
              Rate = Base Rate (₹{baseRate.toFixed(2)}) + FAT Increment ± Bonus/Penalty
            </div>
            <p className="text-gray-500 pt-1">
              SNF values are recorded during milk entry but do not affect the purchasing rate.
            </p>
          </div>
        )}

        {method === 'FIXED' && (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="p-2.5 bg-white rounded border border-gray-200 font-mono text-[#0052cc] font-bold text-xs">
              Rate = Base Rate (₹{baseRate.toFixed(2)})
            </div>
            <p className="text-gray-500 pt-1">
              Flat fixed rate applies to all milk collection entries regardless of FAT or SNF percentage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
