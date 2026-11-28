import { request } from '../../utils/api';
import type {
  BillingPreviewRequest,
  BillingPreviewResponse,
  FarmerHistoryResponse,
  FinalizeSettlementRequest,
  FinalizeSettlementResponse,
  PaginatedBillingFarmers,
  PaginatedSettlementList,
  PaymentCycleOption,
  SettlementDetailResponse,
  SettlementListParams,
} from './billing.types';

export const billingApi = {
  getSupportedCycles: async (): Promise<{ cycles: PaymentCycleOption[] }> => {
    return await request<{ cycles: PaymentCycleOption[] }>('/billing/cycles');
  },

  getFarmers: async (params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedBillingFarmers> => {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 20));
    return await request<PaginatedBillingFarmers>(`/billing/farmers?${query.toString()}`);
  },

  getFarmerHistory: async (
    farmerId: string,
    startDate: string,
    endDate: string
  ): Promise<FarmerHistoryResponse> => {
    const query = new URLSearchParams({ startDate, endDate });
    return await request<FarmerHistoryResponse>(
      `/billing/farmers/${encodeURIComponent(farmerId)}/history?${query.toString()}`
    );
  },

  generatePreview: async (payload: BillingPreviewRequest): Promise<BillingPreviewResponse> => {
    return await request<BillingPreviewResponse>('/billing/preview', 'POST', payload);
  },

  finalizeSettlement: async (
    payload: FinalizeSettlementRequest
  ): Promise<FinalizeSettlementResponse> => {
    return await request<FinalizeSettlementResponse>('/billing/settlements', 'POST', payload);
  },

  getSettlements: async (params: SettlementListParams = {}): Promise<PaginatedSettlementList> => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.farmerId) query.set('farmerId', params.farmerId);
    if (params.status) query.set('status', params.status);
    if (params.settlementReference?.trim()) {
      query.set('settlementReference', params.settlementReference.trim());
    }
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 20));
    return await request<PaginatedSettlementList>(`/billing/settlements?${query.toString()}`);
  },

  getSettlementDetails: async (settlementId: string): Promise<SettlementDetailResponse> => {
    return await request<SettlementDetailResponse>(
      `/billing/settlements/${encodeURIComponent(settlementId)}`
    );
  },
};

