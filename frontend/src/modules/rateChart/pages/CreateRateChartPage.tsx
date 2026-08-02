import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { rateChartFormSchema, type RateChartFormValues } from '../schemas/rateChart.schema';
import { useRateChartMutations } from '../hooks/useRateCharts';
import { BasicInformationForm } from '../components/BasicInformationForm';
import { FormulaConfiguration } from '../components/FormulaConfiguration';
import { StepConfiguration } from '../components/StepConfiguration';
import { BonusPenaltyConfiguration } from '../components/BonusPenaltyConfiguration';
import { PreviewPanel } from '../components/PreviewPanel';
import { ExcelUpload } from '../components/ExcelUpload';

interface CreateRateChartPageProps {
  onBackToList: () => void;
}

export const CreateRateChartPage: React.FC<CreateRateChartPageProps> = ({ onBackToList }) => {
  const methods = useForm<RateChartFormValues>({
    resolver: zodResolver(rateChartFormSchema) as any,
    defaultValues: {
      name: '',
      milkType: 'COW',
      chartType: 'POINT',
      method: 'FAT_SNF',
      baseRate: 38.5,
      fatSteps: [
        { startValue: 3.5, increment: 0.3 },
        { startValue: 4.0, increment: 0.4 },
      ],
      snfSteps: [
        { startValue: 8.5, increment: 0.4 },
        { startValue: 9.0, increment: 0.5 },
      ],
      rules: [],
    },
  });

  const { createChart, activateChart, isCreating, isActivating } = useRateChartMutations();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmitDraft = async (data: RateChartFormValues) => {
    setSubmitError(null);
    try {
      await createChart(data);
      onBackToList();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to create draft rate chart');
    }
  };

  const onSubmitAndActivate = async (data: RateChartFormValues) => {
    setSubmitError(null);
    try {
      const created = await createChart(data);
      await activateChart(created.id);
      onBackToList();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to create and activate rate chart');
    }
  };

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
              <h1 className="text-xl font-bold text-[#091e42] tracking-tight">Create Rate Chart</h1>
              <p className="text-xs text-gray-500">
                Design new milk purchasing formula, step matrix, and bonus rules
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {submitError}
          </div>
        )}

        {/* 2-Column Desktop Grid */}
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

        {/* Sticky Action Save Bar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
            <button
              type="button"
              onClick={onBackToList}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isCreating || isActivating}
                onClick={methods.handleSubmit(onSubmitDraft)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#091e42] text-xs font-bold border border-gray-200 transition-all cursor-pointer"
              >
                {isCreating ? (
                  <span className="animate-spin w-4 h-4 border-2 border-[#091e42] border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </button>

              <button
                type="button"
                disabled={isCreating || isActivating}
                onClick={methods.handleSubmit(onSubmitAndActivate)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isActivating ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save & Activate Now
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
