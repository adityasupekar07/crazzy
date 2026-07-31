export interface FatStep {
  id: string;
  startValue: number;
  increment: number;
}

export interface SnfStep {
  id: string;
  startValue: number;
  increment: number;
}

export interface RateChartLike {
  id: string;
  name: string;
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  category: 'COLLECTION' | 'SALE';
  method: 'FAT_SNF' | 'FAT_ONLY' | 'FIXED';
  baseRate: number;
  isActive: boolean;
  fatSteps: FatStep[];
  snfSteps: SnfStep[];
}

/**
 * Pure calculation utility to calculate rate based on active rate charts.
 */
export function calculateRate(
  rateCharts: RateChartLike[],
  milkType: 'COW' | 'BUFFALO' | 'MIX',
  fat: number,
  snf: number
): { rate: number; chartName: string } {
  const activeChart = rateCharts.find(
    (rc) => rc.isActive && rc.milkType === milkType && rc.category === 'COLLECTION'
  );

  if (!activeChart) {
    return { rate: 0, chartName: 'No rate chart configured' };
  }

  if (activeChart.method === 'FIXED') {
    return { rate: activeChart.baseRate, chartName: activeChart.name };
  }

  if (activeChart.method === 'FAT_ONLY') {
    const totalFatRate = activeChart.fatSteps.reduce((acc, step) => {
      if (fat >= step.startValue) return acc + step.increment;
      return acc;
    }, activeChart.baseRate);
    return { rate: Number(totalFatRate.toFixed(2)), chartName: activeChart.name };
  }

  // FAT_SNF — add up fat + snf increments on top of base rate
  const fatAdd = activeChart.fatSteps.reduce((acc, step) => {
    if (fat >= step.startValue) return acc + step.increment;
    return acc;
  }, 0);

  const snfAdd = activeChart.snfSteps.reduce((acc, step) => {
    if (snf >= step.startValue) return acc + step.increment;
    return acc;
  }, 0);

  const totalRate = Number((activeChart.baseRate + fatAdd + snfAdd).toFixed(2));
  return { rate: totalRate, chartName: activeChart.name };
}
