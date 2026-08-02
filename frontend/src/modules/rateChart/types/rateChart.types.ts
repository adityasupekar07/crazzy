export type MilkType = 'COW' | 'BUFFALO' | 'MIX';
export type ChartType = 'POINT' | 'EXCEL';
export type RateMethod = 'FAT_SNF' | 'FAT_ONLY' | 'FIXED';
export type RuleAxis = 'FAT' | 'SNF';
export type RateChartStatus = 'ALL' | 'ACTIVE' | 'DRAFT';

export interface FatStep {
  id?: string;
  startValue: number;
  increment: number;
  rateChartId?: string;
}

export interface SnfStep {
  id?: string;
  startValue: number;
  increment: number;
  rateChartId?: string;
}

export interface BonusPenaltyRule {
  id?: string;
  axis: RuleAxis;
  fromValue: number;
  toValue: number;
  amount: number;
  rateChartId?: string;
}

export interface ExcelMatrix {
  fatHeader: number[];
  snfHeader: number[];
  rates: number[][];
}

export interface RateChart {
  id: string;
  name: string;
  milkType: MilkType;
  category: 'COLLECTION';
  chartType: ChartType;
  method: RateMethod;
  baseRate: number;
  isActive: boolean;
  effectiveFrom?: string | Date | null;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  fatSteps: FatStep[];
  snfSteps: SnfStep[];
  rules: BonusPenaltyRule[];
  excelMatrix?: ExcelMatrix | null;
}

export interface CreateChartPayload {
  name: string;
  milkType: MilkType;
  chartType: ChartType;
  method: RateMethod;
  baseRate: number;
  fatSteps?: { startValue: number; increment: number }[];
  snfSteps?: { startValue: number; increment: number }[];
  rules?: { axis: RuleAxis; fromValue: number; toValue: number; amount: number }[];
  excelMatrix?: ExcelMatrix;
}

export interface UpdateChartPayload {
  name?: string;
  milkType?: MilkType;
  chartType?: ChartType;
  method?: RateMethod;
  baseRate?: number;
  fatSteps?: { startValue: number; increment: number }[];
  snfSteps?: { startValue: number; increment: number }[];
  rules?: { axis: RuleAxis; fromValue: number; toValue: number; amount: number }[];
  excelMatrix?: ExcelMatrix;
}

export interface GetChartsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  milkType?: MilkType;
  chartType?: ChartType;
  status?: RateChartStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedRateCharts {
  items: RateChart[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActiveChartQueryParams {
  milkType?: MilkType;
  method?: RateMethod;
  chartType?: ChartType;
}

export interface PreviewPayload {
  method: RateMethod;
  baseRate: number;
  fatSteps?: { startValue: number; increment: number }[];
  snfSteps?: { startValue: number; increment: number }[];
  rules?: { axis: RuleAxis; fromValue: number; toValue: number; amount: number }[];
  excelMatrix?: ExcelMatrix;
  sampleFat?: number;
  sampleSnf?: number;
  sampleQuantity?: number;
}

export interface PreviewResponse {
  sampleInput: {
    fat: number;
    snf: number;
    quantity: number;
    method: RateMethod;
  };
  baseRate: number;
  fatAdjustment: number;
  snfAdjustment: number;
  bonus: number;
  penalty: number;
  finalRate: number;
  amount: number;
  warnings: string[];
  breakdown?: string[];
}

export interface ValidateExcelResponse {
  valid: boolean;
  summary: {
    rows: number;
    columns: number;
    cells: number;
  };
  warnings: string[];
  errors: string[];
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}
