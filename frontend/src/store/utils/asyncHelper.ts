export type StoreStatus = 'idle' | 'loading' | 'success' | 'error';

export interface BaseStoreState {
  status: StoreStatus;
  error: string | null;
}

/**
 * Standardized helper for executing async store actions with status transitions.
 */
export async function executeAsyncAction<T>(
  set: (partial: Partial<any>) => void,
  actionFn: () => Promise<T>,
  fallbackErrorMessage: string = 'Operation failed'
): Promise<{ success: boolean; data?: T; error?: string }> {
  set({ status: 'loading', error: null });
  try {
    const data = await actionFn();
    set({ status: 'success', error: null });
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = err?.message || fallbackErrorMessage;
    set({ status: 'error', error: errorMsg });
    return { success: false, error: errorMsg };
  }
}
