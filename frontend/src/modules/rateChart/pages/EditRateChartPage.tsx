import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Lock, Copy, AlertTriangle } from 'lucide-react';
import { rateChartFormSchema, type RateChartFormValues } from '../schemas/rateChart.schema';
import { useSingleRateChart, useRateChartMutations } from '../hooks/useRateCharts';
import { BasicInformationForm } from '../components/BasicInformationForm';
import { FormulaConfiguration } from '../components/FormulaConfiguration';
import { StepConfiguration } from '../components/StepConfiguration';
import { BonusPenaltyConfiguration } from '../components/BonusPenaltyConfiguration';
import { PreviewPanel } from '../components/PreviewPanel';
import { ExcelUpload } from '../components/ExcelUpload';

interface EditRateChartPageProps {
  chartId: string;
  onBackToList: () => void;
  onNavigateToEdit: (newChartId: string) => void;
}

export const EditRateChartPage: React.FC<EditRateChartPageProps> = ({
  chartId,
  onBackToList,
  onNavigateToEdit,
}) => {
  const { data: existingChart, isLoading, isError } = useSingleRateChart(chartId);
  const { updateChart, cloneChart, isUpdating, isCloning } = useRateChartMutations();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<RateChartFormValues>({
    resolver: zodResolver(rateChartFormSchema) as any,
    defaultValues: {
      name: '',
      milkType: 'COW',
      chartType: 'POINT',
      method: 'FAT_SNF',
      baseRate: 0,
      fatSteps: [],
      snfSteps: [],
      rules: [],
    },
  });

  useEffect(() => {
    if (existingChart) {
      methods.reset({
        name: existingChart.name,
        milkType: existingChart.milkType,
        chartType: existingChart.chartType,
        method: existingChart.method,
        baseRate: existingChart.baseRate,
        fatSteps: existingChart.fatSteps.map((s) => ({
          startValue: s.startValue,
          increment: s.increment,
        })),
        snfSteps: existingChart.snfSteps.map((s) => ({
          startValue: s.startValue,
          increment: s.increment,
        })),
        rules: existingChart.rules.map((r) => ({
          axis: r.axis,
          fromValue: r.fromValue,
          toValue: r.toValue,
          amount: r.amount,
        })),
        excelMatrix: existingChart.excelMatrix || undefined,
      });
    }
  }, [existingChart, methods]);

  const handleUpdate = async (data: RateChartFormValues) => {
    setSubmitError(null);
    try {
      await updateChart({ id: chartId, payload: data });
      onBackToList();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to update draft rate chart');
    }
  };

  const handleCloneToEdit = async () => {
    try {
      const cloned = await cloneChart(chartId);
      onNavigateToEdit(cloned.id);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to clone chart');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-500 text-xs">Loading rate chart details...</p>
      </div>
    );
  }

  if (isError || !existingChart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 bg-white border border-gray-200 rounded-xl max-w-md mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#091e42] mb-1">Rate Chart Not Found</h3>
          <p className="text-xs text-gray-500 mb-4">
            The requested rate chart could not be loaded.
          </p>
          <button
            onClick={onBackToList}
            className="px-4 py-2 bg-[#0052cc] text-white rounded-lg text-xs font-bold"
          >
            Back to Rate Chart List
          </button>
        </div>
      </div>
    );
  }

  const isActiveChart = existingChart.isActive;

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-7xl mx-auto px-2 py-4">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToList}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#091e42] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#091e42] tracking-tight">
                  Edit Rate Chart
                </h1>
                {isActiveChart ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock className="w-3 h-3 mr-1" />
                    ACTIVE (LOCKED)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    DRAFT
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{existingChart.name}</p>
            </div>
          </div>
        </div>

        {/* Active Chart Immutability Warning Banner */}
        {isActiveChart && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-xs">
                  Active Rate Charts are Immutable
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  To protect historical financial accounting, active rate charts cannot be modified directly. Duplicate this chart to create an editable draft.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isCloning}
              onClick={handleCloneToEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md whitespace-nowrap transition-all cursor-pointer"
            >
              {isCloning ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Clone to Editable Draft
            </button>
          </div>
        )}

        {submitError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {submitError}
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <fieldset disabled={isActiveChart} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24">
            {/* Main Form Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <BasicInformationForm />
              <FormulaConfiguration />
              <ExcelUpload />
              <StepConfiguration />
              <BonusPenaltyConfiguration />
            </div>

            {/* Sticky Preview Sidebar (4 cols) */}
            <div className="lg:col-span-4">
              <PreviewPanel />
            </div>
          </div>
        </fieldset>

        {/* Sticky Action Save Bar */}
        {!isActiveChart && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
              <button
                type="button"
                onClick={onBackToList}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={methods.handleSubmit(handleUpdate)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isUpdating ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft Changes
              </button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
};
