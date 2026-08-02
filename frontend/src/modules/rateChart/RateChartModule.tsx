import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RateChartListPage } from './pages/RateChartListPage';
import { CreateRateChartPage } from './pages/CreateRateChartPage';
import { EditRateChartPage } from './pages/EditRateChartPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export type RateChartSubView = 'list' | 'create' | 'edit';

export const RateChartModuleContent: React.FC = () => {
  const [subView, setSubView] = useState<RateChartSubView>('list');
  const [editingChartId, setEditingChartId] = useState<string | null>(null);

  const handleNavigateToList = () => {
    setSubView('list');
    setEditingChartId(null);
  };

  const handleNavigateToCreate = () => {
    setSubView('create');
    setEditingChartId(null);
  };

  const handleNavigateToEdit = (chartId: string) => {
    setEditingChartId(chartId);
    setSubView('edit');
  };

  switch (subView) {
    case 'create':
      return <CreateRateChartPage onBackToList={handleNavigateToList} />;
    case 'edit':
      return editingChartId ? (
        <EditRateChartPage
          chartId={editingChartId}
          onBackToList={handleNavigateToList}
          onNavigateToEdit={handleNavigateToEdit}
        />
      ) : (
        <RateChartListPage
          onNavigateToCreate={handleNavigateToCreate}
          onNavigateToEdit={handleNavigateToEdit}
        />
      );
    case 'list':
    default:
      return (
        <RateChartListPage
          onNavigateToCreate={handleNavigateToCreate}
          onNavigateToEdit={handleNavigateToEdit}
        />
      );
  }
};

export const RateChartModule: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RateChartModuleContent />
    </QueryClientProvider>
  );
};
