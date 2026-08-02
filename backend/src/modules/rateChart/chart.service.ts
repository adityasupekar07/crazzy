// ================================
// chart.service.ts
// ================================

import prisma from "../../db/index.js";
import { cache } from "../../services/cache.service.js";
import { cacheKeys } from "../../utils/cacheKeys.js";
import ApiError from "../../utils/ApiError.js";
import { calculateRate, RateCalculationInput } from "./chart.utils.js";

const DEFAULT_CATEGORY = "COLLECTION";

/**
 * CREATE DRAFT RATE CHART
 */
const createRateChart = async (adminId: string, payload: any) => {
  const chart = await prisma.rateChart.create({
    data: {
      name: payload.name,
      milkType: payload.milkType,
      category: DEFAULT_CATEGORY as any,
      chartType: payload.chartType || "POINT",
      method: payload.method || "FAT_SNF",
      baseRate: payload.baseRate || 0,
      isActive: false, // Created in DRAFT mode, requires explicit activation
      adminId,
      fatSteps: {
        create: payload.fatSteps || [],
      },
      snfSteps: {
        create: payload.snfSteps || [],
      },
      rules: {
        create: payload.rules || [],
      },
    },
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });

  await cache.del(cacheKeys.allCharts(adminId));
  return chart;
};

/**
 * GET ALL CHARTS WITH PAGINATION & FILTERING
 */
const getAllCharts = async (adminId: string, queryParams: any = {}) => {
  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {
    adminId,
    category: DEFAULT_CATEGORY,
  };

  if (queryParams.milkType) where.milkType = queryParams.milkType;
  if (queryParams.chartType) where.chartType = queryParams.chartType;
  if (queryParams.status === "ACTIVE") where.isActive = true;
  if (queryParams.status === "DRAFT" || queryParams.status === "ARCHIVED") where.isActive = false;

  if (queryParams.search) {
    where.name = {
      contains: queryParams.search,
      mode: "insensitive",
    };
  }

  const sortBy = queryParams.sortBy || "createdAt";
  const sortOrder = queryParams.sortOrder || "desc";

  const [total, charts] = await Promise.all([
    prisma.rateChart.count({ where }),
    prisma.rateChart.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        fatSteps: true,
        snfSteps: true,
        rules: true,
      },
    }),
  ]);

  return {
    items: charts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * GET ACTIVE CHART
 */
const getActiveChart = async (
  adminId: string,
  milkType: string,
  method: string = "FAT_SNF",
  chartType?: string
) => {
  const cacheKey = cacheKeys.activeChart(adminId, milkType, DEFAULT_CATEGORY, method);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const whereClause: any = {
    adminId,
    milkType: milkType as any,
    category: DEFAULT_CATEGORY as any,
    method: method as any,
    isActive: true,
  };

  if (chartType) {
    whereClause.chartType = chartType as any;
  }

  const chart = await prisma.rateChart.findFirst({
    where: whereClause,
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });

  if (chart) {
    await cache.set(cacheKey, chart, 60 * 60);
  }

  return chart;
};

/**
 * GET SINGLE CHART
 */
const getSingleChart = async (id: string) => {
  const cacheKey = cacheKeys.singleChart(id);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const chart = await prisma.rateChart.findUnique({
    where: { id },
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });

  if (!chart) {
    throw new ApiError(404, "Rate chart not found");
  }

  await cache.set(cacheKey, chart);
  return chart;
};

/**
 * UPDATE DRAFT CHART ONLY
 */
const updateChart = async (id: string, adminId: string, payload: any) => {
  const existing = await prisma.rateChart.findUnique({ where: { id } });

  if (!existing || existing.adminId !== adminId) {
    throw new ApiError(404, "Rate chart not found");
  }

  if (existing.isActive) {
    throw new ApiError(400, "Active rate charts are immutable. Deactivate or clone to create a new draft.");
  }

  // Delete existing sub-records before recreating
  await prisma.fatStep.deleteMany({ where: { rateChartId: id } });
  await prisma.snfStep.deleteMany({ where: { rateChartId: id } });
  await prisma.bonusPenaltyRule.deleteMany({ where: { rateChartId: id } });

  await cache.del(cacheKeys.singleChart(id));
  await cache.del(cacheKeys.allCharts(adminId));

  return prisma.rateChart.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      milkType: payload.milkType ?? existing.milkType,
      chartType: payload.chartType ?? existing.chartType,
      method: payload.method ?? existing.method,
      baseRate: payload.baseRate ?? existing.baseRate,
      category: DEFAULT_CATEGORY as any,
      fatSteps: payload.fatSteps ? { create: payload.fatSteps } : undefined,
      snfSteps: payload.snfSteps ? { create: payload.snfSteps } : undefined,
      rules: payload.rules ? { create: payload.rules } : undefined,
    },
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });
};

/**
 * DELETE DRAFT CHART ONLY
 */
const deleteChart = async (id: string, adminId: string) => {
  const existing = await prisma.rateChart.findUnique({ where: { id } });

  if (!existing || existing.adminId !== adminId) {
    throw new ApiError(404, "Rate chart not found");
  }

  if (existing.isActive) {
    throw new ApiError(400, "Active rate charts cannot be deleted. Archive or deactivate first.");
  }

  // Protect historical financial data by ensuring chart is not referenced in milk entries
  const usageCount = await (prisma.milkEntry as any).count({
    where: {
      rateChartId: id,
    },
  });

  if (usageCount > 0) {
    throw new ApiError(
      
      400,
      `Cannot delete rate chart. It is referenced by ${usageCount} historical milk collection entry/entries.`
    );
  }

  await cache.del(cacheKeys.singleChart(id));
  await cache.del(cacheKeys.allCharts(adminId));
  await cache.clearPattern("active-chart:*");

  return prisma.rateChart.delete({ where: { id } });
};

/**
 * ATOMIC ACTIVATION TRANSACTION
 */
const activateChart = async (id: string, adminId: string) => {
  const chartToActivate = await prisma.rateChart.findUnique({ where: { id } });

  if (!chartToActivate || chartToActivate.adminId !== adminId) {
    throw new ApiError(404, "Rate chart not found");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Deactivate currently active chart for this combination
    await tx.rateChart.updateMany({
      where: {
        adminId,
        milkType: chartToActivate.milkType,
        category: DEFAULT_CATEGORY as any,
        method: chartToActivate.method,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // 2. Activate selected chart
    const activated = await tx.rateChart.update({
      where: { id },
      data: {
        isActive: true,
        effectiveFrom: new Date(),
      },
      include: {
        fatSteps: true,
        snfSteps: true,
        rules: true,
      },
    });

    // 3. Clear Redis Cache
    await cache.del(cacheKeys.allCharts(adminId));
    await cache.del(cacheKeys.activeChart(adminId, activated.milkType, DEFAULT_CATEGORY, activated.method));

    return activated;
  });
};

/**
 * CLONE API
 */
const cloneChart = async (id: string, adminId: string) => {
  const original = await prisma.rateChart.findUnique({
    where: { id },
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });

  if (!original || original.adminId !== adminId) {
    throw new ApiError(404, "Rate chart not found");
  }

  const cloned = await prisma.rateChart.create({
    data: {
      name: `${original.name} (Copy)`,
      milkType: original.milkType,
      category: DEFAULT_CATEGORY as any,
      chartType: original.chartType,
      method: original.method,
      baseRate: original.baseRate,
      isActive: false, // Cloned chart starts as DRAFT
      adminId,
      fatSteps: {
        create: original.fatSteps.map((s) => ({ startValue: s.startValue, increment: s.increment })),
      },
      snfSteps: {
        create: original.snfSteps.map((s) => ({ startValue: s.startValue, increment: s.increment })),
      },
      rules: {
        create: original.rules.map((r) => ({ axis: r.axis, fromValue: r.fromValue, toValue: r.toValue, amount: r.amount })),
      },
    },
    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });

  await cache.del(cacheKeys.allCharts(adminId));
  return cloned;
};

/**
 * PREVIEW CALCULATION (PURE MEMORY)
 */
const previewChart = async (payload: any) => {
  const calculationInput: RateCalculationInput = {
    method: payload.method || "FAT_SNF",
    baseRate: payload.baseRate || 0,
    fatSteps: payload.fatSteps || [],
    snfSteps: payload.snfSteps || [],
    rules: payload.rules || [],
    excelMatrix: payload.excelMatrix,
    fat: payload.sampleFat ?? 3.5,
    snf: payload.sampleSnf ?? 8.5,
  };

  const result = calculateRate(calculationInput);
  const quantity = payload.sampleQuantity || 1;
  const amount = Number((result.rate * quantity).toFixed(2));
  const warnings: string[] = [];

  if (result.rate === 0 && payload.baseRate > 0) {
    warnings.push("Calculated rate evaluated to 0. Check if penalty rules exceed base rate.");
  }

  return {
    sampleInput: {
      fat: calculationInput.fat,
      snf: calculationInput.snf,
      quantity,
      method: calculationInput.method,
    },
    baseRate: result.baseRate,
    fatAdjustment: result.fatBonusPenalty,
    snfAdjustment: result.snfBonusPenalty,
    bonus: result.totalBonusPenalty > 0 ? result.totalBonusPenalty : 0,
    penalty: result.totalBonusPenalty < 0 ? Math.abs(result.totalBonusPenalty) : 0,
    finalRate: result.rate,
    amount,
    calculatedPrice: result.rate, // Preserved for backward compatibility
    warnings,
    breakdown: result.breakdown,
  };
};

/**
 * VALIDATE EXCEL MATRIX (PURE MEMORY)
 */
const validateExcel = async (payload: any) => {
  const { excelMatrix } = payload;
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!excelMatrix || !excelMatrix.fatHeader || !excelMatrix.snfHeader || !excelMatrix.rates) {
    errors.push("Invalid Excel matrix format: fatHeader, snfHeader, and rates matrix grid are required");
    return {
      valid: false,
      summary: {
        rows: 0,
        columns: 0,
        cells: 0,
      },
      warnings: [],
      errors,
    };
  }

  const rows = excelMatrix.snfHeader.length;
  const columns = excelMatrix.fatHeader.length;
  const cells = rows * columns;

  if (excelMatrix.rates.length !== rows) {
    errors.push(`Matrix row count (${excelMatrix.rates.length}) does not match SNF header count (${rows})`);
  }

  for (let i = 0; i < excelMatrix.rates.length; i++) {
    if (Array.isArray(excelMatrix.rates[i]) && excelMatrix.rates[i].length !== columns) {
      warnings.push(`Row ${i + 1} column count (${excelMatrix.rates[i].length}) differs from FAT header count (${columns})`);
    }
  }

  return {
    valid: errors.length === 0,
    summary: {
      rows,
      columns,
      cells,
    },
    warnings,
    errors,
  };
};

/**
 * CALCULATE LIVE RATE FOR ACTIVE CHART
 */
const calculateLiveRate = async (adminId: string, payload: any) => {
  const { milkType, fat, snf, quantity = 1, method = "FAT_SNF" } = payload;

  const activeChart: any = await getActiveChart(adminId, milkType, method);

  if (!activeChart) {
    throw new ApiError(404, `No active rate chart found for milk type '${milkType}'`);
  }

  const calcResult = calculateRate({
    method: activeChart.method,
    baseRate: activeChart.baseRate,
    fatSteps: activeChart.fatSteps,
    snfSteps: activeChart.snfSteps,
    rules: activeChart.rules,
    fat,
    snf,
  });

  const amount = Number((calcResult.rate * quantity).toFixed(2));

  return {
    rate: calcResult.rate,
    amount,
    baseRate: calcResult.baseRate,
    fatAdjustment: calcResult.fatBonusPenalty,
    snfAdjustment: calcResult.snfBonusPenalty,
    bonus: calcResult.totalBonusPenalty > 0 ? calcResult.totalBonusPenalty : 0,
    penalty: calcResult.totalBonusPenalty < 0 ? Math.abs(calcResult.totalBonusPenalty) : 0,
    chartId: activeChart.id,
    chartName: activeChart.name,
    breakdown: calcResult.breakdown,
  };
};

export const RateChartService = {
  createRateChart,
  getAllCharts,
  getActiveChart,
  getSingleChart,
  updateChart,
  deleteChart,
  activateChart,
  cloneChart,
  previewChart,
  validateExcel,
  calculateLiveRate,
};