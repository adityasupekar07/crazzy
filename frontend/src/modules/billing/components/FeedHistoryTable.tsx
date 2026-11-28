import React from 'react';
import { FeedSalesHistory } from './FeedSalesHistory';
import type { FarmerHistoryFeedItem } from '../billing.types';

interface FeedHistoryTableProps {
  items: FarmerHistoryFeedItem[];
  summary: {
    previousOutstanding: string;
    currentSales: string;
    totalOutstanding: string;
  };
}

export const FeedHistoryTable: React.FC<FeedHistoryTableProps> = ({ items, summary }) => {
  return <FeedSalesHistory items={items} summary={summary} />;
};

