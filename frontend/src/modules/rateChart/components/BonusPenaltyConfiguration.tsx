import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Award, AlertCircle } from 'lucide-react';
import type { RateChartFormValues } from '../schemas/rateChart.schema';

export const BonusPenaltyConfiguration: React.FC = () => {
  const { control, register, watch, formState: { errors } } = useFormContext<RateChartFormValues>();
  const method = watch('method');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  if (method === 'FIXED') {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#091e42] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#deebff] text-[#0052cc] text-xs font-bold flex items-center justify-center border border-blue-200">
              4
            </span>
            Bonus & Penalty Threshold Rules
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Apply flat bonus (+) or penalty (-) adjustments when FAT/SNF percentage falls within specified ranges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => append({ axis: 'FAT', fromValue: 0.0, toValue: 3.0, amount: -2.0 })}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Rule
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Award className="w-7 h-7 text-gray-400 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500 font-medium">No Bonus or Penalty rules configured.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Rules allow rewarding high FAT/SNF quality or penalizing sub-standard collection entries.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3">
            <span className="col-span-3">Axis</span>
            <span className="col-span-3">From %</span>
            <span className="col-span-3">To %</span>
            <span className="col-span-2">Adjustment (₹)</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {fields.map((field, index) => {
            const ruleAmount = watch(`rules.${index}.amount`) || 0;
            return (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-3 items-center bg-gray-50 border border-gray-200 p-2.5 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Axis (FAT vs SNF) */}
                <div className="col-span-3">
                  <select
                    {...register(`rules.${index}.axis`)}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs font-bold text-[#091e42] focus:border-[#0052cc] outline-none"
                  >
                    <option value="FAT">FAT Axis</option>
                    <option value="SNF">SNF Axis</option>
                  </select>
                </div>

                {/* From % */}
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.1"
                    {...register(`rules.${index}.fromValue`, { valueAsNumber: true })}
                    placeholder="0.0"
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-[#091e42] focus:border-[#0052cc] outline-none"
                  />
                </div>

                {/* To % */}
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.1"
                    {...register(`rules.${index}.toValue`, { valueAsNumber: true })}
                    placeholder="3.0"
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-[#091e42] focus:border-[#0052cc] outline-none"
                  />
                </div>

                {/* Amount (Bonus + vs Penalty -) */}
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.5"
                    {...register(`rules.${index}.amount`, { valueAsNumber: true })}
                    placeholder="-1.50"
                    className={`w-full bg-white border rounded px-2.5 py-1.5 text-xs font-black outline-none ${
                      ruleAmount > 0
                        ? 'text-green-700 border-green-300'
                        : ruleAmount < 0
                        ? 'text-red-600 border-red-300'
                        : 'text-gray-700 border-gray-200'
                    }`}
                  />
                </div>

                {/* Remove Rule */}
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errors.rules && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {errors.rules.message}
        </p>
      )}
    </div>
  );
};
