import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, Grid, ListFilter } from 'lucide-react';
import { usePreviewRateChart } from '../hooks/useRateCharts';
import type { RateChartFormValues } from '../schemas/rateChart.schema';
import type { PreviewPayload, BonusPenaltyRule } from '../types/rateChart.types';

export const PreviewPanel: React.FC = () => {
  const { watch } = useFormContext<RateChartFormValues>();
  const [viewMode, setViewMode] = useState<'GRID' | 'SIMULATOR'>('GRID');

  // Form values
  const milkType = watch('milkType') || 'COW';
  const method = watch('method') || 'FAT_SNF';
  const baseRate = watch('baseRate') || 0;
  const fatSteps = watch('fatSteps') || [];
  const snfSteps = watch('snfSteps') || [];
  const rules = watch('rules') || [];
  const excelMatrix = watch('excelMatrix');

  // Live Simulator Sample Inputs
  const [sampleFat, setSampleFat] = useState(3.5);
  const [sampleSnf, setSampleSnf] = useState(8.5);
  const [sampleQuantity, setSampleQuantity] = useState(10);

  // Determine Standard Reference Quality based on Milk Type
  const referenceQuality = useMemo(() => {
    switch (milkType) {
      case 'BUFFALO':
        return { baseFat: 6.0, baseSnf: 9.0 };
      case 'MIX':
        return { baseFat: 4.5, baseSnf: 8.5 };
      case 'COW':
      default:
        return { baseFat: 3.5, baseSnf: 8.5 };
    }
  }, [milkType]);

  // Generate FAT & SNF Ranges for Matrix Grid
  const { fatRange, snfRange } = useMemo(() => {
    let fMin = 3.0, fMax = 4.5;
    let sMin = 7.5, sMax = 9.5;

    if (milkType === 'BUFFALO') {
      fMin = 5.0; fMax = 7.0;
      sMin = 8.0; sMax = 9.5;
    } else if (milkType === 'MIX') {
      fMin = 3.5; fMax = 5.0;
      sMin = 7.5; sMax = 9.0;
    }

    const fArr: number[] = [];
    for (let f = fMin; f <= fMax + 0.05; f += 0.1) {
      fArr.push(Number(f.toFixed(1)));
    }

    const sArr: number[] = [];
    for (let s = sMin; s <= sMax + 0.05; s += 0.1) {
      sArr.push(Number(s.toFixed(1)));
    }

    return { fatRange: fArr, snfRange: sArr };
  }, [milkType]);

  // Backend preview query payload for single sample calculation
  const previewPayload: PreviewPayload = {
    method,
    baseRate,
    fatSteps,
    snfSteps,
    rules,
    excelMatrix,
    sampleFat,
    sampleSnf,
    sampleQuantity,
  };

  const { data: previewData, isLoading, isError } = usePreviewRateChart(previewPayload);

  // Pure Cell Rate Calculator (Relative to Base Rate & Reference Quality)
  const calculateCellRate = (fat: number, snf: number): number => {
    // 1. If Fixed Rate
    if (method === 'FIXED') return Number(baseRate.toFixed(2));

    // 2. Excel Matrix Lookup if present
    if (excelMatrix && excelMatrix.rates?.length > 0) {
      const fIdx = excelMatrix.fatHeader.findIndex((f) => Math.abs(f - fat) < 0.05);
      const sIdx = excelMatrix.snfHeader.findIndex((s) => Math.abs(s - snf) < 0.05);
      if (fIdx !== -1 && sIdx !== -1) {
        return excelMatrix.rates[sIdx]?.[fIdx] ?? baseRate;
      }
    }

    // 3. Step Increment Engine
    let currentRate = baseRate;

    // FAT Step Adjustment
    if (fatSteps.length > 0) {
      const primaryFatStep = fatSteps[0];
      if (fat > primaryFatStep.startValue) {
        const fatDiff = (fat - primaryFatStep.startValue) * 10;
        currentRate += fatDiff * primaryFatStep.increment;
      } else if (fat < primaryFatStep.startValue) {
        const fatDiff = (primaryFatStep.startValue - fat) * 10;
        currentRate -= fatDiff * primaryFatStep.increment;
      }
    }

    // SNF Step Adjustment (Only if FAT_SNF)
    if (method === 'FAT_SNF' && snfSteps.length > 0) {
      const primarySnfStep = snfSteps[0];
      if (snf > primarySnfStep.startValue) {
        const snfDiff = (snf - primarySnfStep.startValue) * 10;
        currentRate += snfDiff * primarySnfStep.increment;
      } else if (snf < primarySnfStep.startValue) {
        const snfDiff = (primarySnfStep.startValue - snf) * 10;
        currentRate -= snfDiff * primarySnfStep.increment;
      }
    }

    // Bonus & Penalty Rules
    let bonusPenalty = 0;
    for (const rule of rules as BonusPenaltyRule[]) {
      if (rule.axis === 'FAT' && fat >= rule.fromValue && fat <= rule.toValue) {
        bonusPenalty += rule.amount;
      } else if (rule.axis === 'SNF' && method === 'FAT_SNF' && snf >= rule.fromValue && snf <= rule.toValue) {
        bonusPenalty += rule.amount;
      }
    }

    return Number(Math.max(0, currentRate + bonusPenalty).toFixed(2));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5 sticky top-6">
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#deebff] text-[#0052cc] flex items-center justify-center border border-blue-200">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#091e42]">Rate Chart Preview</h3>
            <p className="text-[10px] text-gray-500">Live FAT × SNF Matrix & Rate Simulator</p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode('GRID')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              viewMode === 'GRID'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#091e42]'
            }`}
          >
            <Grid className="w-3 h-3" />
            Grid Matrix
          </button>

          <button
            type="button"
            onClick={() => setViewMode('SIMULATOR')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              viewMode === 'SIMULATOR'
                ? 'bg-[#0052cc] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#091e42]'
            }`}
          >
            <ListFilter className="w-3 h-3" />
            Breakdown
          </button>
        </div>
      </div>

      {/* ── SUMMARY BANNER ABOVE TABLE ── */}
      <div className="bg-[#deebff] border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Base Rate ({milkType})
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#0052cc]">
              ₹{baseRate > 0 ? baseRate.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-gray-600 font-medium">/ Litre</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Reference Quality
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-white text-[#0052cc] font-extrabold text-xs border border-blue-200 shadow-sm mt-0.5">
            FAT {referenceQuality.baseFat}% • SNF {referenceQuality.baseSnf}%
          </span>
        </div>
      </div>

      {/* ── MODE 1: FAT × SNF PREVIEW MATRIX GRID ── */}
      {viewMode === 'GRID' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>
              Rows: <strong className="text-[#091e42]">FAT %</strong> • Cols:{' '}
              <strong className="text-[#091e42]">SNF %</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052cc] inline-block" />
              Base Reference Cell
            </span>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-center border-collapse">
                <thead className="sticky top-0 z-20 bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-200 py-2.5 px-3 text-[10px] font-bold text-gray-600 uppercase border-r border-gray-300">
                      FAT \ SNF
                    </th>
                    {snfRange.map((snf) => {
                      const isBaseSnf = snf === referenceQuality.baseSnf;
                      return (
                        <th
                          key={snf}
                          className={`py-2 px-2.5 text-[11px] font-bold whitespace-nowrap ${
                            isBaseSnf
                              ? 'bg-[#deebff] text-[#0052cc] border-x border-blue-300'
                              : 'text-gray-600'
                          }`}
                        >
                          {snf.toFixed(1)}%
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {fatRange.map((fat) => {
                    const isBaseFatRow = fat === referenceQuality.baseFat;
                    return (
                      <tr key={fat} className="hover:bg-gray-50/80 transition-colors">
                        {/* Sticky FAT Header Column */}
                        <td
                          className={`sticky left-0 z-10 py-2 px-3 text-xs font-bold border-r border-gray-200 whitespace-nowrap ${
                            isBaseFatRow
                              ? 'bg-[#deebff] text-[#0052cc]'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {fat.toFixed(1)}%
                        </td>

                        {/* Rate Cells */}
                        {snfRange.map((snf) => {
                          const isBaseCell =
                            fat === referenceQuality.baseFat &&
                            snf === referenceQuality.baseSnf;
                          const cellRate = calculateCellRate(fat, snf);

                          return (
                            <td
                              key={snf}
                              className={`py-2 px-2 text-[11px] font-semibold transition-all relative ${
                                isBaseCell
                                  ? 'bg-[#0052cc] text-white font-black shadow-md border-2 border-blue-600 rounded-md scale-105 z-10'
                                  : isBaseFatRow || snf === referenceQuality.baseSnf
                                  ? 'bg-blue-50/40 text-gray-800'
                                  : 'text-gray-700'
                              }`}
                            >
                              {isBaseCell && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-amber-400 text-slate-950 px-1 rounded uppercase tracking-tighter shadow-sm whitespace-nowrap">
                                  BASE
                                </span>
                              )}
                              ₹{cellRate.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: LIVE SIMULATOR ITEMIZE BREAKDOWN ── */}
      {viewMode === 'SIMULATOR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                FAT %
              </label>
              <input
                type="number"
                step="0.1"
                value={sampleFat}
                onChange={(e) => setSampleFat(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-[#091e42] font-bold focus:border-[#0052cc] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                SNF %
              </label>
              <input
                type="number"
                step="0.1"
                value={sampleSnf}
                onChange={(e) => setSampleSnf(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-[#091e42] font-bold focus:border-[#0052cc] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Qty (L)
              </label>
              <input
                type="number"
                step="1"
                value={sampleQuantity}
                onChange={(e) => setSampleQuantity(parseFloat(e.target.value) || 1)}
                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-[#091e42] font-bold focus:border-[#0052cc] outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-gray-400 text-xs">
              Calculating backend breakdown...
            </div>
          ) : isError || !previewData ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs text-gray-500">
              Set base rate to generate live calculation breakdown.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#deebff] border border-blue-200 rounded-lg p-3 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                  Computed Rate / Litre
                </span>
                <span className="text-2xl font-black text-[#0052cc]">
                  ₹{previewData.finalRate.toFixed(2)}
                </span>
                <div className="mt-2 pt-2 border-t border-blue-200/80 flex justify-between text-xs font-bold text-[#091e42]">
                  <span>Total Payout ({sampleQuantity} L):</span>
                  <span>₹{previewData.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Base Rate:</span>
                  <span className="font-bold text-[#091e42]">₹{previewData.baseRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0052cc]" /> FAT Adjustment:
                  </span>
                  <span className={`font-semibold ${previewData.fatAdjustment > 0 ? 'text-green-700' : previewData.fatAdjustment < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {previewData.fatAdjustment >= 0 ? '+' : ''}₹{previewData.fatAdjustment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> SNF Adjustment:
                  </span>
                  <span className={`font-semibold ${previewData.snfAdjustment > 0 ? 'text-blue-700' : previewData.snfAdjustment < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {previewData.snfAdjustment >= 0 ? '+' : ''}₹{previewData.snfAdjustment.toFixed(2)}
                  </span>
                </div>
                {previewData.bonus > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Bonus Premium:</span>
                    <span>+₹{previewData.bonus.toFixed(2)}</span>
                  </div>
                )}
                {previewData.penalty > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Penalty Deduction:
                    </span>
                    <span>-₹{previewData.penalty.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings Banner */}
      {previewData?.warnings && previewData.warnings.length > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            {previewData.warnings.map((w, idx) => (
              <p key={idx}>{w}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
