import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FileSpreadsheet, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { rateChartService } from '../services/rateChart.service';
import { useRateChartMutations } from '../hooks/useRateCharts';
import type { RateChartFormValues } from '../schemas/rateChart.schema';
import type { ValidateExcelResponse } from '../types/rateChart.types';

export const ExcelUpload: React.FC = () => {
  const { setValue, watch } = useFormContext<RateChartFormValues>();
  const chartType = watch('chartType');
  const excelMatrix = watch('excelMatrix');

  const { validateExcel, isValidatingExcel } = useRateChartMutations();

  const [fileName, setFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateExcelResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (chartType !== 'EXCEL') return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setValidationResult(null);

    try {
      const parsedMatrix = await rateChartService.parseExcelFile(file);
      setValue('excelMatrix', parsedMatrix);

      const result = await validateExcel(parsedMatrix);
      setValidationResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Failed to read Excel matrix format');
    }
  };

  const handleClear = () => {
    setFileName(null);
    setValidationResult(null);
    setParseError(null);
    setValue('excelMatrix', undefined);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#091e42] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200">
              Excel
            </span>
            Excel Matrix Upload
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Import rate grid table from Excel sheet (Row 1: FAT Header %, Column A: SNF Header %).
          </p>
        </div>
      </div>

      {!excelMatrix ? (
        <label className="border-2 border-dashed border-gray-300 hover:border-[#0052cc] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100/60 group">
          <FileSpreadsheet className="w-10 h-10 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
          <p className="text-xs font-bold text-[#091e42]">Click or drag Excel file to upload</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Supports .xlsx, .xls, and .csv formats</p>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-xs text-[#091e42]">{fileName || 'Uploaded Matrix'}</p>
                <p className="text-[11px] text-gray-500">
                  {excelMatrix.fatHeader.length} FAT Cols × {excelMatrix.snfHeader.length} SNF Rows
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Validation Status */}
          {isValidatingExcel ? (
            <div className="p-2.5 text-xs text-gray-500 flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-[#0052cc] border-t-transparent rounded-full" />
              Validating matrix with backend server...
            </div>
          ) : validationResult ? (
            <div className="space-y-2">
              {validationResult.valid ? (
                <div className="p-2.5 rounded bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>
                    Excel matrix validated! {validationResult.summary.cells} cells ready for collection.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    Validation Errors Found
                  </div>
                  {validationResult.errors.map((err, idx) => (
                    <p key={idx} className="pl-6 text-[11px]">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {parseError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {parseError}
        </div>
      )}
    </div>
  );
};
