import React from 'react';
import { Copy, X } from 'lucide-react';
import type { RateChart } from '../types/rateChart.types';

interface CloneModalProps {
  chart: RateChart | null;
  isOpen: boolean;
  isCloning: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CloneModal: React.FC<CloneModalProps> = ({
  chart,
  isOpen,
  isCloning,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !chart) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091e42]/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#091e42] p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mb-4">
          <Copy className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[#091e42] mb-2">Duplicate Rate Chart?</h3>
        <p className="text-xs text-gray-600 mb-4">
          This will create a new draft copy named{' '}
          <span className="font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded">
            "{chart.name} (Copy)"
          </span>{' '}
          preserving all steps and rules.
        </p>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isCloning}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isCloning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isCloning ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {isCloning ? 'Cloning...' : 'Duplicate Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};
