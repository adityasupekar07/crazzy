import axios from 'axios';
import * as XLSX from 'xlsx';
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
  MilkType,
  RateMethod,
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export interface CalculateLiveRatePayload {
  milkType: MilkType;
  fat: number;
  snf: number;
  quantity?: number;
  method?: RateMethod;
}

export interface CalculateLiveRateResponse {
  rate: number;
  amount: number;
  baseRate: number;
  fatAdjustment: number;
  snfAdjustment: number;
  bonus: number;
  penalty: number;
  chartId: string;
  chartName: string;
  breakdown?: any;
}

export const rateChartService = {
  // ── BACKEND API CALLS ────────────────────────────────────────────────────────

  /** Fetch paginated & filtered list of rate charts */
  getAllCharts: async (params: GetChartsQueryParams = {}): Promise<PaginatedRateCharts> => {
    const response = await apiClient.get<ApiResponse<PaginatedRateCharts>>('', { params });
    return response.data.data;
  },

  /** Fetch currently active rate chart for milk type & method */
  getActiveChart: async (params: ActiveChartQueryParams = {}): Promise<RateChart | null> => {
    const response = await apiClient.get<ApiResponse<RateChart | null>>('/active', { params });
    return response.data.data;
  },

  /** Fetch single rate chart by ID */
  getSingleChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.get<ApiResponse<RateChart>>(`/${id}`);
    return response.data.data;
  },

  /** Create new draft rate chart */
  createChart: async (payload: CreateChartPayload): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>('', payload);
    return response.data.data;
  },

  /** Update existing draft rate chart */
  updateChart: async (id: string, payload: UpdateChartPayload): Promise<RateChart> => {
    const response = await apiClient.patch<ApiResponse<RateChart>>(`/${id}`, payload);
    return response.data.data;
  },

  /** Delete draft rate chart */
  deleteChart: async (id: string): Promise<void> => {
    await apiClient.delete(`/${id}`);
  },

  /** Activate rate chart atomically */
  activateChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>(`/${id}/activate`);
    return response.data.data;
  },

  /** Clone rate chart into draft copy */
  cloneChart: async (id: string): Promise<RateChart> => {
    const response = await apiClient.post<ApiResponse<RateChart>>(`/${id}/clone`);
    return response.data.data;
  },

  /** Memory preview calculation via backend Preview API */
  previewChart: async (payload: PreviewPayload): Promise<PreviewResponse> => {
    const response = await apiClient.post<ApiResponse<PreviewResponse>>('/preview', payload);
    return response.data.data;
  },

  /** Calculate rate for active chart via backend Calculate API */
  calculateRate: async (payload: CalculateLiveRatePayload): Promise<CalculateLiveRateResponse> => {
    const response = await apiClient.post<ApiResponse<CalculateLiveRateResponse>>('/calculate', payload);
    return response.data.data;
  },

  /** Validate Excel matrix structure via backend Validate API */
  validateExcel: async (excelMatrix: ExcelMatrix): Promise<ValidateExcelResponse> => {
    const response = await apiClient.post<ApiResponse<ValidateExcelResponse>>('/validate-excel', { excelMatrix });
    return response.data.data;
  },

  // ── EXCEL PARSER & FORMATTERS ────────────────────────────────────────────────

  /**
   * Parse uploaded Excel/CSV file into standard ExcelMatrix structure
   * Header Row: FAT values (e.g. 3.0, 3.5, 4.0, 4.5, 5.0)
   * Header Column (Col A): SNF values (e.g. 7.5, 8.0, 8.5, 9.0)
   * Intersecting Cells: Rates
   */
  parseExcelFile: async (file: File): Promise<ExcelMatrix> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!jsonGrid || jsonGrid.length < 2) {
            throw new Error('Excel sheet must contain at least 1 header row and 1 data row');
          }

          const headerRow = jsonGrid[0];
          const fatHeader: number[] = [];
          for (let c = 1; c < headerRow.length; c++) {
            const val = parseFloat(headerRow[c]);
            if (!isNaN(val)) fatHeader.push(val);
          }

          const snfHeader: number[] = [];
          const rates: number[][] = [];

          for (let r = 1; r < jsonGrid.length; r++) {
            const row = jsonGrid[r];
            if (!row || row.length === 0) continue;
            const snfVal = parseFloat(row[0]);
            if (isNaN(snfVal)) continue;

            snfHeader.push(snfVal);
            const rowRates: number[] = [];

            for (let c = 1; c <= fatHeader.length; c++) {
              const rateVal = parseFloat(row[c]);
              rowRates.push(isNaN(rateVal) ? 0 : rateVal);
            }
            rates.push(rowRates);
          }

          resolve({
            fatHeader,
            snfHeader,
            rates,
          });
        } catch (err: any) {
          reject(new Error(err.message || 'Failed to parse Excel file format'));
        }
      };

      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  },

  /** Helper formatting for Milk Types */
  formatMilkTypeLabel: (milkType: MilkType): string => {
    switch (milkType) {
      case 'COW':
        return 'Cow Milk (गाय)';
      case 'BUFFALO':
        return 'Buffalo Milk (म्हैस)';
      case 'MIX':
        return 'Mix Milk (मिश्र)';
      default:
        return milkType;
    }
  },

  /** Helper formatting for Rate Methods */
  formatRateMethodLabel: (method: RateMethod): string => {
    switch (method) {
      case 'FAT_SNF':
        return 'FAT + SNF Both';
      case 'FAT_ONLY':
        return 'FAT Only';
      case 'FIXED':
        return 'Fixed Rate';
      default:
        return method;
    }
  },
};
