import React from 'react';
import { PaymentCycleSelector } from './PaymentCycleSelector';
import { useBillingSettlementStore } from '../../../store';
import { getTodayLocalYmd } from '../utils/cycleResolver';

export const BillingPeriodSelector: React.FC = () => {
  const selectedCycle = useBillingSettlementStore((state) => state.selectedCycle);
  const setSelectedCycle = useBillingSettlementStore((state) => state.setSelectedCycle);
  const today = getTodayLocalYmd();

  return (
    <PaymentCycleSelector
      startDate={selectedCycle?.startDate ?? today}
      endDate={selectedCycle?.endDate ?? today}
      onChange={(range) => setSelectedCycle(range)}
    />
  );
};

