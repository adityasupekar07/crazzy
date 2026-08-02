import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { RateChart } from '../types/rateChart.types';

interface DeleteConfirmModalProps {
  chart: RateChart | null;
  isOpen: boolean;
  isDeleting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  chart,
  isOpen,
  isDeleting,
  errorMessage,
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

        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[#091e42] mb-2">Delete Rate Chart?</h3>
        <p className="text-xs text-gray-600 mb-4">
          Are you sure you want to permanently delete draft rate chart{' '}
          <span className="font-bold text-[#091e42] font-mono bg-gray-100 px-2 py-0.5 rounded">
            "{chart.name}"
          </span>
          ?
        </p>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs mb-4">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};
