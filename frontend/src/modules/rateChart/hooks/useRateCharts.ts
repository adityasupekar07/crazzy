import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateChartService } from '../services/rateChart.service';
import type {
  GetChartsQueryParams,
  ActiveChartQueryParams,
  CreateChartPayload,
  UpdateChartPayload,
  PreviewPayload,
} from '../types/rateChart.types';

export const RATE_CHART_KEYS = {
  all: ['rateCharts'] as const,
  list: (filters: GetChartsQueryParams) => ['rateCharts', 'list', filters] as const,
  active: (params: ActiveChartQueryParams) => ['rateCharts', 'active', params] as const,
  detail: (id: string) => ['rateCharts', 'detail', id] as const,
  preview: (payload: PreviewPayload) => ['rateCharts', 'preview', payload] as const,
};

/**
 * Fetch paginated & filtered list of rate charts
 */
export function useRateCharts(filters: GetChartsQueryParams = {}) {
  return useQuery({
    queryKey: RATE_CHART_KEYS.list(filters),
    queryFn: () => rateChartService.getAllCharts(filters),
  });
}

/**
 * Fetch currently active rate chart
 */
export function useActiveRateChart(params: ActiveChartQueryParams = {}) {
  return useQuery({
    queryKey: RATE_CHART_KEYS.active(params),
    queryFn: () => rateChartService.getActiveChart(params),
  });
}

/**
 * Fetch single rate chart details
 */
export function useSingleRateChart(id: string | undefined) {
  return useQuery({
    queryKey: RATE_CHART_KEYS.detail(id || ''),
    queryFn: () => rateChartService.getSingleChart(id!),
    enabled: !!id,
  });
}

/**
 * Live preview calculation hook
 */
export function usePreviewRateChart(payload: PreviewPayload, enabled: boolean = true) {
  return useQuery({
    queryKey: RATE_CHART_KEYS.preview(payload),
    queryFn: () => rateChartService.previewChart(payload),
    enabled: enabled && !!payload.baseRate && payload.baseRate > 0,
    staleTime: 500,
  });
}

/**
 * Mutations for Rate Chart operations with automatic cache invalidation
 */
export function useRateChartMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateChartPayload) => rateChartService.createChart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChartPayload }) =>
      rateChartService.updateChart(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.detail(variables.id) });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => rateChartService.activateChart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.all });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => rateChartService.cloneChart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rateChartService.deleteChart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATE_CHART_KEYS.all });
    },
  });

  const validateExcelMutation = useMutation({
    mutationFn: rateChartService.validateExcel,
  });

  return {
    createChart: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateChart: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    activateChart: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,
    cloneChart: cloneMutation.mutateAsync,
    isCloning: cloneMutation.isPending,
    deleteChart: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    validateExcel: validateExcelMutation.mutateAsync,
    isValidatingExcel: validateExcelMutation.isPending,
  };
}
