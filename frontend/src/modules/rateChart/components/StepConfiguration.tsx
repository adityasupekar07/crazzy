import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';
import type { RateChartFormValues } from '../schemas/rateChart.schema';

export const StepConfiguration: React.FC = () => {
  const { control, register, watch, formState: { errors } } = useFormContext<RateChartFormValues>();
  const method = watch('method');

  const {
    fields: fatFields,
    append: appendFat,
    remove: removeFat,
  } = useFieldArray({
    control,
    name: 'fatSteps',
  });

  const {
    fields: snfFields,
    append: appendSnf,
    remove: removeSnf,
  } = useFieldArray({
    control,
    name: 'snfSteps',
  });

  if (method === 'FIXED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-xs">
          Step configuration is disabled for <span className="font-bold text-[#091e42]">Fixed Rate</span> method.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#091e42] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#deebff] text-[#0052cc] text-xs font-bold flex items-center justify-center border border-blue-200">
              3
            </span>
            Step Increments Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Define starting percentage thresholds and rate increment values per 0.1% change.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAT Step Matrix */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0052cc]" />
              <h3 className="font-bold text-xs text-[#091e42] uppercase tracking-wider">FAT Step Rules</h3>
            </div>
            <button
              type="button"
              onClick={() => appendFat({ startValue: 3.5, increment: 0.3 })}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#deebff] hover:bg-blue-100 text-[#0052cc] border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add FAT Step
            </button>
          </div>

          {fatFields.length === 0 ? (
            <div className="p-4 rounded-lg bg-white border border-dashed border-gray-300 text-center">
              <p className="text-xs text-gray-400">No FAT step rules configured. Click above to add step.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
                <span className="col-span-5">Start FAT %</span>
                <span className="col-span-5">Increment (₹ / 0.1%)</span>
                <span className="col-span-2 text-right">Action</span>
              </div>
              {fatFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="number"
                      step="0.1"
                      {...register(`fatSteps.${index}.startValue`, { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-[#091e42] focus:border-[#0052cc] outline-none"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="number"
                      step="0.05"
                      {...register(`fatSteps.${index}.increment`, { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-[#0052cc] font-bold focus:border-[#0052cc] outline-none"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeFat(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.fatSteps && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.fatSteps.message}
            </p>
          )}
        </div>

        {/* SNF Step Matrix */}
        {method === 'FAT_SNF' && (
          <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-xs text-[#091e42] uppercase tracking-wider">SNF Step Rules</h3>
              </div>
              <button
                type="button"
                onClick={() => appendSnf({ startValue: 8.5, increment: 0.4 })}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add SNF Step
              </button>
            </div>

            {snfFields.length === 0 ? (
              <div className="p-4 rounded-lg bg-white border border-dashed border-gray-300 text-center">
                <p className="text-xs text-gray-400">No SNF step rules configured. Click above to add step.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
                  <span className="col-span-5">Start SNF %</span>
                  <span className="col-span-5">Increment (₹ / 0.1%)</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>
                {snfFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="number"
                        step="0.1"
                        {...register(`snfSteps.${index}.startValue`, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-[#091e42] focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="number"
                        step="0.05"
                        {...register(`snfSteps.${index}.increment`, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-orange-700 font-bold focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeSnf(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.snfSteps && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.snfSteps.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
