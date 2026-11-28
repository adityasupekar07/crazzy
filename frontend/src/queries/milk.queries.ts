import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../utils/api';
import { QUERY_KEYS } from './keys';
import type { 
  MilkEntry, 
  CreateMilkEntryInput, 
} from '../store/collection/useMilkCollectionStore';
import { 
  useMilkCollectionStore, 
  mapRawMilkEntry 
} from '../store/collection/useMilkCollectionStore';

/**
 * Fetch today's milk collection entries with automatic deduplication & SWR caching.
 */
export function useTodayMilkQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.milk.today(),
    queryFn: async (): Promise<MilkEntry[]> => {
      const data: any[] = await request('/milk/today');
      const mapped = (data ?? []).map(mapRawMilkEntry);
      // Sync store
      useMilkCollectionStore.setState({ collections: mapped, status: 'success', error: null });
      return mapped;
    },
  });
}

/**
 * Fetch historical milk entries with filter params.
 */
export function useMilkHistoryQuery(params?: { startDate?: string; endDate?: string; customerId?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.milk.history(params),
    queryFn: async (): Promise<MilkEntry[]> => {
      const queryParts: string[] = [];
      if (params?.startDate) queryParts.push(`startDate=${params.startDate}`);
      if (params?.endDate) queryParts.push(`endDate=${params.endDate}`);
      if (params?.customerId) queryParts.push(`customerId=${params.customerId}`);
      const qs = queryParts.length ? `?${queryParts.join('&')}` : '';

      const data: any[] = await request(`/milk/history${qs}`);
      const mapped = (data ?? []).map(mapRawMilkEntry);
      useMilkCollectionStore.setState({ history: mapped, status: 'success', error: null });
      return mapped;
    },
  });
}

/**
 * Milk collection mutations with automatic cache invalidation of collections and dashboard stats.
 */
export function useMilkMutations() {
  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: async (entry: CreateMilkEntryInput) => {
      return await request('/milk/milk-entry', 'POST', {
        customerCode: String(entry.customerCode),
        code: Number(entry.customerCode),
        customerId: entry.customerId,
        shift: entry.shift,
        milkType: entry.milkType,
        quantity: Number(entry.quantity),
        fat: Number(entry.fat),
        snf: Number(entry.snf ?? 0),
        date: entry.date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.milk.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats() });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: Partial<CreateMilkEntryInput> }) => {
      const payload: any = {};
      if (entry.customerCode) payload.customerCode = String(entry.customerCode);
      if (entry.shift) payload.shift = entry.shift;
      if (entry.milkType) payload.milkType = entry.milkType;
      if (entry.quantity) payload.quantity = Number(entry.quantity);
      if (entry.fat !== undefined) payload.fat = Number(entry.fat);
      if (entry.snf !== undefined) payload.snf = Number(entry.snf);
      return await request(`/milk/${id}`, 'PATCH', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.milk.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats() });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      return await request(`/milk/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.milk.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats() });
    },
  });

  return {
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
