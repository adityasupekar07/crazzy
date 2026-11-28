import type { FetchAdvancesParams } from '../store/advance/useAdvanceStore';

/**
 * Standardized Query Key Factory.
 * 
 * Using tuple-based hierarchical query keys ensures:
 * 1. Automatic, granular cache invalidation (e.g. invalidating QUERY_KEYS.milk.all invalidates today & history).
 * 2. Unambiguous query identity across all components.
 * 3. Prevention of cache collision between different domains.
 */
export const QUERY_KEYS = {
  farmers: {
    all: ['farmers'] as const,
    list: () => ['farmers', 'list'] as const,
    detail: (id: string) => ['farmers', 'detail', id] as const,
  },
  milk: {
    all: ['milk'] as const,
    today: () => ['milk', 'today'] as const,
    history: (params?: { startDate?: string; endDate?: string; customerId?: string }) =>
      ['milk', 'history', params ?? {}] as const,
    detail: (id: string) => ['milk', 'detail', id] as const,
  },
  feed: {
    all: ['feed'] as const,
    dealers: () => ['feed', 'dealers'] as const,
    purchases: () => ['feed', 'purchases'] as const,
    sales: () => ['feed', 'sales'] as const,
  },
  advances: {
    all: ['advances'] as const,
    list: (params?: FetchAdvancesParams) => ['advances', 'list', params ?? {}] as const,
    byCustomer: (customerId: string) => ['advances', 'customer', customerId] as const,
    detail: (id: string) => ['advances', 'detail', id] as const,
  },
  billing: {
    all: ['billing'] as const,
    cycles: () => ['billing', 'cycles'] as const,
    farmers: (params?: { search?: string; page?: number; limit?: number }) =>
      ['billing', 'farmers', params ?? {}] as const,
    farmerHistory: (farmerId: string, startDate: string, endDate: string) =>
      ['billing', 'farmerHistory', farmerId, startDate, endDate] as const,
    settlements: (customerId?: string) => ['billing', 'settlements', customerId ?? 'all'] as const,
    settlementsList: (params?: Record<string, unknown>) =>
      ['billing', 'settlementsList', params ?? {}] as const,
    settlementDetail: (settlementId: string) =>
      ['billing', 'settlementDetail', settlementId] as const,
  },
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
  },
  profile: {
    current: () => ['admin', 'profile'] as const,
  },
  rateCharts: {
    all: ['rateCharts'] as const,
    list: (params?: any) => ['rateCharts', 'list', params ?? {}] as const,
    detail: (id: string) => ['rateCharts', 'detail', id] as const,
    history: (id: string) => ['rateCharts', 'history', id] as const,
    preview: (params?: any) => ['rateCharts', 'preview', params ?? {}] as const,
  },
} as const;

