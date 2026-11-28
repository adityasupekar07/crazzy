import React from 'react';
import { MilkCollectionHistory } from './MilkCollectionHistory';
import type { FarmerHistoryMilkItem } from '../billing.types';

interface MilkCollectionTableProps {
  items: FarmerHistoryMilkItem[];
  summary: {
    totalLitres: string;
    totalAmount: string;
    eligibleCount: number;
    settledCount: number;
  };
}

export const MilkCollectionTable: React.FC<MilkCollectionTableProps> = ({ items, summary }) => {
  return <MilkCollectionHistory items={items} summary={summary} />;
};

