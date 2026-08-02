/**
 * Pure Calculation Utility for Rate Chart Evaluation
 */

export interface StepConfig {
  startValue: number;
  increment: number;
}

export interface RuleConfig {
  axis: "FAT" | "SNF";
  fromValue: number;
  toValue: number;
  amount: number;
}

export interface ExcelMatrixConfig {
  fatHeader: number[];
  snfHeader: number[];
  rates: number[][];
}

export interface RateCalculationInput {
  method: "FAT_SNF" | "FAT_ONLY" | "FIXED";
  baseRate: number;
  fatSteps?: StepConfig[];
  snfSteps?: StepConfig[];
  rules?: RuleConfig[];
  excelMatrix?: ExcelMatrixConfig;
  fat: number;
  snf: number;
}

export interface RateCalculationResult {
  rate: number;
  baseRate: number;
  fatBonusPenalty: number;
  snfBonusPenalty: number;
  totalBonusPenalty: number;
  breakdown: string;
}

/**
 * Calculates rate per litre based on FAT & SNF input
 */
export function calculateRate(input: RateCalculationInput): RateCalculationResult {
  const { method, baseRate, fatSteps = [], snfSteps = [], rules = [], excelMatrix, fat, snf } = input;

  // 1. If Excel Matrix is provided and method is matrix/excel
  if (excelMatrix && excelMatrix.fatHeader.length > 0 && excelMatrix.snfHeader.length > 0) {
    return evaluateExcelMatrix(excelMatrix, fat, snf);
  }

  // 2. Fixed Rate Method
  if (method === "FIXED") {
    return {
      rate: Number(baseRate.toFixed(2)),
      baseRate,
      fatBonusPenalty: 0,
      snfBonusPenalty: 0,
      totalBonusPenalty: 0,
      breakdown: "Fixed Rate",
    };
  }

  // 3. Step-Based Calculation (FAT + SNF or FAT ONLY)
  let calculatedRate = baseRate;

  // FAT Steps adjustment
  if (fatSteps.length > 0) {
    const primaryFatStep = fatSteps[0];
    if (fat > primaryFatStep.startValue) {
      const fatDiff = fat - primaryFatStep.startValue;
      calculatedRate += fatDiff * primaryFatStep.increment;
    }
  }

  // SNF Steps adjustment (only if method is FAT_SNF)
  if (method === "FAT_SNF" && snfSteps.length > 0) {
    const primarySnfStep = snfSteps[0];
    if (snf > primarySnfStep.startValue) {
      const snfDiff = snf - primarySnfStep.startValue;
      calculatedRate += snfDiff * primarySnfStep.increment;
    }
  }

  // Bonus & Penalty rules
  let fatBonusPenalty = 0;
  let snfBonusPenalty = 0;

  for (const rule of rules) {
    if (rule.axis === "FAT" && fat >= rule.fromValue && fat <= rule.toValue) {
      fatBonusPenalty += rule.amount;
    } else if (rule.axis === "SNF" && method === "FAT_SNF" && snf >= rule.fromValue && snf <= rule.toValue) {
      snfBonusPenalty += rule.amount;
    }
  }

  const totalBonusPenalty = fatBonusPenalty + snfBonusPenalty;
  const finalRate = Math.max(0, calculatedRate + totalBonusPenalty);

  return {
    rate: Number(finalRate.toFixed(2)),
    baseRate,
    fatBonusPenalty,
    snfBonusPenalty,
    totalBonusPenalty,
    breakdown: `Base Rate: ₹${baseRate.toFixed(2)} + Steps & Rules adjustment: ₹${(finalRate - baseRate).toFixed(2)}`,
  };
}

/**
 * Excel 2D Matrix Lookup Helper
 */
function evaluateExcelMatrix(matrix: ExcelMatrixConfig, fat: number, snf: number): RateCalculationResult {
  const { fatHeader, snfHeader, rates } = matrix;

  // Find nearest/exact index for FAT
  let fatIdx = fatHeader.findIndex((val) => Math.abs(val - fat) < 0.05);
  if (fatIdx === -1) {
    fatIdx = fatHeader.reduce((closest, curr, idx) => (Math.abs(curr - fat) < Math.abs(fatHeader[closest] - fat) ? idx : closest), 0);
  }

  // Find nearest/exact index for SNF
  let snfIdx = snfHeader.findIndex((val) => Math.abs(val - snf) < 0.05);
  if (snfIdx === -1) {
    snfIdx = snfHeader.reduce((closest, curr, idx) => (Math.abs(curr - snf) < Math.abs(snfHeader[closest] - snf) ? idx : closest), 0);
  }

  const lookedUpRate = rates[fatIdx]?.[snfIdx] ?? 0;

  return {
    rate: Number(lookedUpRate.toFixed(2)),
    baseRate: lookedUpRate,
    fatBonusPenalty: 0,
    snfBonusPenalty: 0,
    totalBonusPenalty: 0,
    breakdown: `Excel Matrix Lookup (FAT: ${fatHeader[fatIdx]}, SNF: ${snfHeader[snfIdx]})`,
  };
}
