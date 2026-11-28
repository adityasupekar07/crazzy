import React from 'react';
import { AdvanceHistory } from './AdvanceHistory';
import type { FarmerHistoryAdvanceItem } from '../billing.types';

interface AdvanceHistoryTableProps {
  items: FarmerHistoryAdvanceItem[];
  summary: {
    totalGiven: string;
    totalRepaid: string;
    remainingOutstanding: string;
  };
}

export const AdvanceHistoryTable: React.FC<AdvanceHistoryTableProps> = ({ items, summary }) => {
  return <AdvanceHistory items={items} summary={summary} />;
};

