export * from './auth/useAuthStore';
export * from './customer/useCustomerStore';
export * from './collection/useMilkCollectionStore';
export * from './feed/useFeedStore';
export * from './advance/useAdvanceStore';
export * from './rate-chart/useRateChartStore';
export * from './profile/useProfileStore';
export * from './billing/useBillingStore';
export * from './dashboard/useDashboardStore';
export * from './language/useLanguageStore';
export * from './ui/useUIStore';

// ── Backwards compatibility re-exports & aliases ─────────────────────────────
import { useCustomerStore } from './customer/useCustomerStore';
import { useMilkCollectionStore } from './collection/useMilkCollectionStore';
import { useProfileStore } from './profile/useProfileStore';
import { useDashboardStore } from './dashboard/useDashboardStore';

export const useFarmerStore = useCustomerStore;
export const useMilkStore = useMilkCollectionStore;

/**
 * Combined backwards-compatibility wrapper for legacy useAdminStore callers.
 */
export function useAdminStore<T = any>(selector?: (state: any) => T): T {
  const profileState = useProfileStore();
  const dashboardState = useDashboardStore();

  const combinedState = {
    profile: profileState.profile,
    dashboardStats: dashboardState.dashboardStats,
    isLoading: profileState.status === 'loading' || dashboardState.status === 'loading',
    status: profileState.status === 'error' || dashboardState.status === 'error' ? 'error' : profileState.status,
    error: profileState.error || dashboardState.error,
    fetchProfile: profileState.fetchProfile,
    updateProfile: profileState.updateProfile,
    fetchDashboard: dashboardState.fetchDashboard,
    reset: () => {
      profileState.reset();
      dashboardState.reset();
    },
  };

  if (selector) {
    return selector(combinedState);
  }
  return combinedState as any;
}
