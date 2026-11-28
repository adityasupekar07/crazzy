import type { BillingSettlementState } from './billing.types';

export const selectIsHistoryValid = (state: BillingSettlementState): boolean => {
  if (!state.selectedFarmer || !state.selectedCycle || !state.farmerHistory) {
    return false;
  }
  return (
    state.farmerHistory.farmer.id === state.selectedFarmer.id &&
    state.farmerHistory.period.startDate === state.selectedCycle.startDate &&
    state.farmerHistory.period.endDate === state.selectedCycle.endDate
  );
};

export const selectCanFetchHistory = (state: BillingSettlementState): boolean => {
  return Boolean(state.selectedFarmer && state.selectedCycle && !state.isHistoryLoading);
};

export const selectCanCalculatePreview = (state: BillingSettlementState): boolean => {
  return (
    selectIsHistoryValid(state) && !state.isHistoryLoading && !state.isPreviewLoading
  );
};

export const selectCanFinalizeSettlement = (state: BillingSettlementState): boolean => {
  return (
    Boolean(state.billPreview) &&
    selectIsHistoryValid(state) &&
    !state.isPreviewLoading &&
    !state.isFinalizing
  );
};

