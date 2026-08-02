import axios from 'axios';
import type {
  RateChart,
  PaginatedRateCharts,
  GetChartsQueryParams,
  ActiveChartQueryParams,
  CreateChartPayload,
  UpdateChartPayload,
  PreviewPayload,
  PreviewResponse,
  ValidateExcelResponse,
  ExcelMatrix,
  ApiResponse,
} from '../types/rateChart.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/rate-chart`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const rateChartApi = {
  // Fetch paginated and filtered rate charts list
  getAllCharts: async (params: GetChartsQueryParams = {}): Promise<PaginatedRateCharts> => {
    const response = await apiClient.get<ApiResponse<PaginatedRateCharts>>('', { params });
    return response.data.data;
  },

  // Fetch currently active rate chart for milk type & method
  getActiveChart: async (params: ActiveChartQueryParams = {}): Promise<RateChart | null> => {
    const response = await apiClient.get<ApiResponse<RateChart | null>>('/active', { params });
    return response.data.data;
  },

  // Fetch single rate chart by ID
  getSingleChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.get<ApiResponse<RateChart>>(`/${id}`);
    return response.data.data;
  },

  // Create new draft rate chart
  createChart: async (payload: CreateChartPayload): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>('', payload);
    return response.data.data;
  },

  // Update existing draft rate chart
  updateChart: async (id: string, payload: UpdateChartPayload): Promise<RateChart> => {
    const response = await apiClient.patch<ApiResponse<RateChart>>(`/${id}`, payload);
    return response.data.data;
  },

  // Delete draft rate chart
  deleteChart: async (id: string): Promise<void> => {
    await apiClient.delete(`/${id}`);
  },

  // Activate rate chart
  activateChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>(`/${id}/activate`);
    return response.data.data;
  },

  // Clone rate chart
  cloneChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>(`/${id}/clone`);
    return response.data.data;
  },

  // Preview calculation in memory
  previewChart: async (payload: PreviewPayload): Promise<PreviewResponse> => {
    const response = await apiClient.post<ApiResponse<PreviewResponse>>('/preview', payload);
    return response.data.data;
  },

  // Validate Excel matrix structure in memory
  validateExcel: async (excelMatrix: ExcelMatrix): Promise<ValidateExcelResponse> => {
    const response = await apiClient.post<ApiResponse<ValidateExcelResponse>>('/validate-excel', { excelMatrix });
    return response.data.data;
  },
};
