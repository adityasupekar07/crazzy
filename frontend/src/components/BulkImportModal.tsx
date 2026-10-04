import { useState } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { exportToCsv } from '../utils/csvExport';
import type { Customer } from '../store/customer/useCustomerStore';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmers: Customer[];
  onImportEntry: (entry: any) => Promise<boolean>;
  onComplete: () => void;
}

interface ParsedImportRow {
  rawLine: string;
  code: number;
  farmerName?: string;
  farmerId?: string;
  milkType: string;
  quantity: number;
  fat: number;
  snf: number;
  shift: 'MORNING' | 'EVENING';
  isValid: boolean;
  validationError?: string;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  farmers,
  onImportEntry,
  onComplete,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summaryMsg, setSummaryMsg] = useState<{ success: number; failed: number } | null>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const headers = ['code', 'quantity', 'fat', 'snf', 'shift', 'milkType'];
    const sampleRows = [
      [101, 15.5, 4.2, 8.5, 'MORNING', 'COW'],
      [102, 22.0, 6.8, 9.0, 'MORNING', 'BUFFALO'],
      [103, 10.0, 4.0, 8.3, 'EVENING', 'COW'],
    ];
    exportToCsv('sample_milk_import.csv', headers, sampleRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setSummaryMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file is empty or contains only headers.');
        return;
      }

      // Check header line
      const startIndex = lines[0].toLowerCase().includes('code') ? 1 : 0;
      const results: ParsedImportRow[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
        if (parts.length < 4) continue;

        const rawCode = parseInt(parts[0], 10);
        const qty = parseFloat(parts[1]);
        const fat = parseFloat(parts[2]);
        const snf = parseFloat(parts[3]);
        const shiftRaw = (parts[4] || 'MORNING').toUpperCase();
        const shift: 'MORNING' | 'EVENING' = shiftRaw === 'EVENING' ? 'EVENING' : 'MORNING';
        const milkTypeRaw = (parts[5] || 'COW').toUpperCase();
        const milkType = ['COW', 'BUFFALO', 'MIX'].includes(milkTypeRaw) ? milkTypeRaw : 'COW';

        // Validate against farmers list
        const farmer = farmers.find((f) => f.code === rawCode || String(f.code) === String(rawCode));

        let isValid = true;
        let validationError = '';

        if (isNaN(rawCode)) {
          isValid = false;
          validationError = 'Invalid code';
        } else if (!farmer) {
          isValid = false;
          validationError = 'Farmer code not found';
        } else if (isNaN(qty) || qty <= 0) {
          isValid = false;
          validationError = 'Invalid quantity';
        } else if (isNaN(fat) || fat < 0) {
          isValid = false;
          validationError = 'Invalid FAT';
        } else if (isNaN(snf) || snf < 0) {
          isValid = false;
          validationError = 'Invalid SNF';
        }

        results.push({
          rawLine: line,
          code: rawCode,
          farmerName: farmer?.name,
          farmerId: farmer?.id,
          milkType: farmer?.milkType || milkType,
          quantity: qty,
          fat: fat || 0,
          snf: snf || 0,
          shift,
          isValid,
          validationError,
        });
      }

      setParsedRows(results);
    };

    reader.readAsText(uploadedFile);
  };

  const handleStartImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows to import.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const payload = {
        customerCode: row.code,
        customerName: row.farmerName,
        customerId: row.farmerId,
        milkType: row.milkType,
        quantity: row.quantity,
        fat: row.fat,
        snf: row.snf,
        shift: row.shift,
        rate: 0, // Backend / store auto calculates rate
        totalAmount: 0,
      };

      const success = await onImportEntry(payload);
      if (success) successCount++;
      else failedCount++;

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsProcessing(false);
    setSummaryMsg({ success: successCount, failed: failedCount });
    onComplete();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const totalVolume = parsedRows.filter((r) => r.isValid).reduce((acc, r) => acc + (r.quantity || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0052cc]" />
            <div>
              <h3 className="text-sm font-bold text-[#091e42] uppercase tracking-wider">
                Bulk Milk Collection CSV Import
              </h3>
              <p className="text-[10px] text-gray-500">Import collections from CSV analyzer data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Top Actions: Upload Area & Template Download */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 border-2 border-dashed border-gray-300 hover:border-[#0052cc] rounded-xl p-4 text-center cursor-pointer transition relative bg-gray-50/50">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <span className="text-xs font-bold text-gray-700 block">
                {file ? file.name : 'Click or drop CSV file here'}
              </span>
              <span className="text-[10px] text-gray-400">format: code, qty, fat, snf, shift, milkType</span>
            </div>

            <div className="text-center sm:text-left">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Sample
              </button>
            </div>
          </div>

          {/* Validation Metrics */}
          {parsedRows.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-green-700 block">Valid Rows</span>
                <strong className="text-base text-green-800 font-mono">{validCount}</strong>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-red-700 block">Invalid Rows</span>
                <strong className="text-base text-red-800 font-mono">{invalidCount}</strong>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Litres</span>
                <strong className="text-base text-blue-800 font-mono">{totalVolume.toFixed(1)} L</strong>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Importing entries to database...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#0052cc] h-2 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary Message */}
          {summaryMsg && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-[#091e42]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <span>
                  Import Finished: <strong>{summaryMsg.success}</strong> saved successfully,{' '}
                  <strong>{summaryMsg.failed}</strong> failed.
                </span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Farmer</th>
                      <th className="py-2 px-3">Shift</th>
                      <th className="py-2 px-3">Litres</th>
                      <th className="py-2 px-3">FAT / SNF</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 font-bold text-[#0052cc]">{row.code || '—'}</td>
                        <td className="py-2 px-3 font-sans font-medium">{row.farmerName || '—'}</td>
                        <td className="py-2 px-3 text-[10px]">{row.shift}</td>
                        <td className="py-2 px-3">{row.quantity} L</td>
                        <td className="py-2 px-3">{row.fat}% / {row.snf}%</td>
                        <td className="py-2 px-3 text-right">
                          {row.isValid ? (
                            <span className="text-green-700 bg-green-100 text-[10px] px-1.5 py-0.5 rounded font-sans font-bold">
                              Valid
                            </span>
                          ) : (
                            <span className="text-red-700 bg-red-100 text-[10px] px-1.5 py-0.5 rounded font-sans font-bold" title={row.validationError}>
                              {row.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="py-2 px-4 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartImport}
            disabled={isProcessing || validCount === 0}
            className="py-2 px-5 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-blue-300 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Import {validCount} Entries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
