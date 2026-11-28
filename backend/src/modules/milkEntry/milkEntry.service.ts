// ========================================
// milkEntry.service.ts
// ========================================

import prisma from "../../db/index.js";
import ApiError from "../../utils/ApiError.js";
import logger from "../../config/logger.js";
import { cache } from "../../services/cache.service.js";
import { cacheKeys } from "../../utils/cacheKeys.js";
import {
  getTodayDate,
  getTodayEnd,
  getTodayStart,
} from "./milkEntry.helper.js";
import { MilkType, CollectionShift } from "@prisma/client";
import { Decimal } from "../../utils/decimal.js";
import { RateCalculationService } from "../rateChart/services/rateCalculation.service.js";
import {
  getIstStartOfDay,
  getIstEndOfDay,
  formatIstDate,
} from "../rateChart/utils/dateUtils.js";
import { MilkEntryAuditService } from "./services/milkEntryAudit.service.js";

/**
 * ========================================
 * CONSTANTS
 * ========================================
 */

const TODAY_ENTRIES_CACHE_TTL =
  60 * 60 * 5;

/**
 * ========================================
 * GET TODAY MILK ENTRIES
 * ========================================
 */

const getTodayMilkEntries =
  async (
    adminId: string
  ) => {

    /**
     * TODAY DATE
     */

    const today =
      getTodayDate();

    /**
     * CACHE KEY
     */

    const cacheKey =
      cacheKeys.todayMilkEntries(
        adminId,
        today
      );

    /**
     * CACHE HIT
     */

    const cachedEntries =
      await cache.get<any[]>(
        cacheKey
      );

    if (cachedEntries) {

      logger.info(
        "REDIS HIT: TODAY MILK ENTRIES",
        {
          adminId,

          cacheKey,
        }
      );

      return cachedEntries;
    }

    logger.info(
      "REDIS MISS: TODAY MILK ENTRIES",
      {
        adminId,

        cacheKey,
      }
    );

    /**
     * DATABASE QUERY
     */

    const entries =
      await prisma.milkEntry.findMany({
        where: {
          customer: {
            adminId,
          },

          date: {
            gte:
              getTodayStart(),

            lte:
              getTodayEnd(),
          },
        },

        include: {
          customer: true,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    /**
     * STORE CACHE
     */

    await cache.set(
      cacheKey,
      entries,
      TODAY_ENTRIES_CACHE_TTL
    );

    logger.info(
      "TODAY MILK ENTRIES STORED IN REDIS",
      {
        adminId,

        cacheKey,

        totalEntries:
          entries.length,
      }
    );

    return entries;
  };

/**
 * ========================================
 * GET SINGLE ENTRY
 * ========================================
 */

const getSingleMilkEntry = async (id: string) => {
  const entry = await prisma.milkEntry.findUnique({
    where: { id },
    include: {
      customer: true,
      rateChart: {
        select: {
          id: true,
          name: true,
          method: true,
          status: true,
        },
      },
    },
  });

  if (!entry) {
    logger.warn("MILK ENTRY NOT FOUND", { id });
    throw new ApiError(404, "Milk entry not found");
  }

  return entry;
};

/**
 * ========================================
 * CREATE MILK ENTRY (Phase 2C Integrated)
 * ========================================
 */
const createMilkEntry = async (adminId: string, payload: any) => {
  logger.info("[SERVICE START] createMilkEntry", { adminId, payload });

  // 1. Auth check
  if (!adminId) {
    throw new ApiError(401, "Unauthorized");
  }

  // 2. Customer Identification & Dairy Ownership check
  const customerCodeNum =
    payload.code !== undefined
      ? Number(payload.code)
      : payload.customerCode
      ? Number(payload.customerCode)
      : undefined;

  if (!customerCodeNum && !payload.customerId) {
    logger.warn("CUSTOMER IDENTIFIER MISSING");
    throw new ApiError(400, "Customer code or customerId is required");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      adminId,
      ...(payload.customerId
        ? { id: payload.customerId }
        : { code: customerCodeNum }),
    },
  });

  if (!customer) {
    logger.warn("CUSTOMER NOT FOUND", { adminId, payload });
    throw new ApiError(404, "Customer not found or does not belong to this dairy");
  }

  // 3. Milk Type Validation
  const milkType = payload.milkType as MilkType;
  if (!milkType || !Object.values(MilkType).includes(milkType)) {
    throw new ApiError(400, `Invalid milk type: ${payload.milkType}`);
  }

  // 4. Shift Validation
  const shift = payload.shift as CollectionShift;
  if (!shift || !Object.values(CollectionShift).includes(shift)) {
    throw new ApiError(400, `Invalid collection shift: ${payload.shift}`);
  }

  // 5. Authoritative Collection Date (backend validated timestamp, default now)
  const collectionDate = payload.date ? new Date(payload.date) : new Date();
  if (isNaN(collectionDate.getTime())) {
    throw new ApiError(400, "Invalid collection date format");
  }

  // 6. Quantity, Fat, SNF Validation
  let quantity: Decimal;
  let fat: Decimal;
  let snf: Decimal = new Decimal("0");

  try {
    quantity = new Decimal(payload.quantity?.toString() || "0");
    fat = new Decimal(payload.fat?.toString() || "0");
    if (payload.snf !== undefined && payload.snf !== null) {
      snf = new Decimal(payload.snf.toString());
    }
  } catch {
    throw new ApiError(400, "Invalid numeric format for quantity, fat, or snf");
  }

  if (quantity.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  if (fat.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "Fat must be greater than 0");
  }
  if (payload.snf !== undefined && payload.snf !== null && snf.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "SNF must be greater than 0");
  }

  // 7. Authoritative Rate Calculation via RateCalculationService
  // Frontend provided rate/totalAmount/rateChartId is strictly disregarded
  const calcResult = await RateCalculationService.calculateMilkRate({
    dairyId: adminId,
    milkType,
    fat,
    snf,
    quantity,
    collectionDate,
  });

  // 8. Transactional Persistence with Concurrency Protection & Duplicate Prevention
  const savedEntry = await prisma.$transaction(async (tx) => {
    // Advisory lock keyed on (customerId, shift, calendarDate) prevents concurrent duplicate submissions
    const lockKey = `milk_entry_creation:${customer.id}:${shift}:${formatIstDate(collectionDate)}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const istDayStart = getIstStartOfDay(collectionDate);
    const istDayEnd = getIstEndOfDay(collectionDate);

    const existingEntry = await tx.milkEntry.findFirst({
      where: {
        customerId: customer.id,
        shift,
        date: {
          gte: istDayStart,
          lte: istDayEnd,
        },
      },
    });

    if (existingEntry) {
      logger.warn("ENTRY ALREADY EXISTS", {
        customerId: customer.id,
        shift,
        date: formatIstDate(collectionDate),
      });
      throw new ApiError(
        409,
        `Entry for ${shift} shift already exists on ${formatIstDate(collectionDate)} for this customer`
      );
    }

    const calcSnapshot = {
      rateChartId: calcResult.rateChartId,
      rateChartName: calcResult.rateChartName,
      calculationMethod: calcResult.method,
      appliedRate: new Decimal(calcResult.rate).toFixed(4),
      quantity: quantity.toFixed(2),
      appliedFat: new Decimal(calcResult.details.appliedFat).toFixed(2),
      appliedSnf: calcResult.details.appliedSnf ? new Decimal(calcResult.details.appliedSnf).toFixed(2) : null,
      baseRate: calcResult.details.baseRate ? new Decimal(calcResult.details.baseRate).toFixed(4) : null,
      fatAdjustment: calcResult.details.fatAdjustment ? new Decimal(calcResult.details.fatAdjustment).toFixed(4) : null,
      snfAdjustment: calcResult.details.snfAdjustment ? new Decimal(calcResult.details.snfAdjustment).toFixed(4) : null,
      formulaDescription: calcResult.details.formulaDescription || null,
      totalAmount: new Decimal(calcResult.totalAmount).toFixed(2),
      collectionDate: collectionDate.toISOString(),
      details: calcResult.details,
    };

    const created = await tx.milkEntry.create({
      data: {
        customerId: customer.id,
        date: collectionDate,
        shift,
        milkType,
        quantity: quantity.toNumber(),
        fat: new Decimal(calcResult.details.appliedFat).toNumber(),
        snf: calcResult.details.appliedSnf ? new Decimal(calcResult.details.appliedSnf).toNumber() : null,
        rate: new Decimal(calcResult.rate).toNumber(),
        totalAmount: new Decimal(calcResult.totalAmount).toNumber(),
        rateChartId: calcResult.rateChartId,
        calculationSnapshot: calcSnapshot,
      } as any,
      include: {
        customer: true,
        rateChart: {
          select: {
            id: true,
            name: true,
            method: true,
            status: true,
          },
        },
      },
    });

    await MilkEntryAuditService.recordAudit(tx, {
      milkEntryId: created.id,
      adminId,
      customerId: customer.id,
      rateChartId: calcResult.rateChartId,
      action: "CREATED",
      originalValues: null,
      newValues: {
        quantity: quantity.toNumber(),
        fat: new Decimal(calcResult.details.appliedFat).toNumber(),
        snf: calcResult.details.appliedSnf ? new Decimal(calcResult.details.appliedSnf).toNumber() : null,
        rate: new Decimal(calcResult.rate).toNumber(),
        totalAmount: new Decimal(calcResult.totalAmount).toNumber(),
        rateChartId: calcResult.rateChartId,
      },
      reason: "Initial milk collection",
      performedBy: adminId,
    });

    return created;
  });

  logger.info("[AFTER DB CREATE - SUCCESS]", {
    entryId: savedEntry.id,
    customerId: customer.id,
    rateChartId: calcResult.rateChartId,
    rate: calcResult.rate,
    totalAmount: calcResult.totalAmount,
  });

  // 9. Cache Updates (Non-blocking fail-safe)
  try {
    const today = getTodayDate();
    const cacheKey = cacheKeys.todayMilkEntries(adminId, today);
    const cachedEntries = await cache.get<any[]>(cacheKey);

    if (cachedEntries) {
      cachedEntries.unshift(savedEntry);
      await cache.set(cacheKey, cachedEntries, TODAY_ENTRIES_CACHE_TTL);
    }

    await cache.clearPattern(`milk-entries-by-date:${adminId}:*`);
  } catch (cacheErr) {
    logger.warn("[CACHE OPERATIONS FAILED - GRACEFULLY IGNORED]", { error: cacheErr });
  }

  // 10. Return saved collection and calculation snapshot
  return {
    ...savedEntry,
    calculationSnapshot: (savedEntry as any).calculationSnapshot || {
      rateChartId: calcResult.rateChartId,
      rateChartName: calcResult.rateChartName,
      calculationMethod: calcResult.method,
      appliedRate: calcResult.rate,
      calculatedAmount: calcResult.totalAmount,
      appliedFat: calcResult.details.appliedFat,
      appliedSnf: calcResult.details.appliedSnf,
      collectionDate: collectionDate.toISOString(),
      details: calcResult.details,
    },
  };
};

/**
 * ========================================
 * HISTORICAL MILK ENTRY CORRECTION
 * (Strict Phase 2D Financial Integrity)
 * ========================================
 */
const correctMilkEntry = async (
  adminId: string,
  id: string,
  payload: {
    quantity?: number | string;
    fat?: number | string;
    snf?: number | string;
    milkType?: MilkType;
    reason: string;
  }
) => {
  if (!payload.reason || typeof payload.reason !== "string" || payload.reason.trim().length === 0) {
    throw new ApiError(400, "Correction reason is mandatory for modifying milk entry financial or measurement parameters");
  }

  const existingEntry = await prisma.milkEntry.findUnique({
    where: { id },
    include: { customer: true, rateChart: true },
  });

  if (!existingEntry) {
    logger.warn("MILK ENTRY NOT FOUND FOR CORRECTION", { id });
    throw new ApiError(404, "Milk entry not found");
  }

  // Tenant Isolation: Caller must own customer
  if (existingEntry.customer.adminId !== adminId) {
    throw new ApiError(403, "Forbidden: You do not own this collection record");
  }

  if ((existingEntry as any).isReversed) {
    throw new ApiError(400, "Cannot correct a reversed milk collection record");
  }

  const newQuantity =
    payload.quantity !== undefined
      ? new Decimal(payload.quantity.toString())
      : new Decimal(existingEntry.quantity.toString());

  const newFat =
    payload.fat !== undefined
      ? new Decimal(payload.fat.toString())
      : existingEntry.fat !== null
      ? new Decimal(existingEntry.fat.toString())
      : null;

  const newSnf =
    payload.snf !== undefined
      ? new Decimal(payload.snf.toString())
      : existingEntry.snf !== null
      ? new Decimal(existingEntry.snf.toString())
      : new Decimal("0");

  const newMilkType = (payload.milkType as MilkType) || existingEntry.milkType;

  if (newQuantity.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  if (newFat && newFat.lessThanOrEqualTo(0)) {
    throw new ApiError(400, "Fat must be greater than 0");
  }

  // Historical RateChart Enforcement:
  // Must use originally associated rate chart. If missing, fail with 422!
  if (!existingEntry.rateChartId) {
    throw new ApiError(
      422,
      "Original RateChart association missing. Historical collection cannot be automatically recalculated. Administrative resolution required."
    );
  }

  let calcResult: any;
  if (newFat !== null) {
    calcResult = await RateCalculationService.calculateWithChartId(existingEntry.rateChartId, {
      fat: newFat,
      snf: newSnf,
      quantity: newQuantity,
      milkType: newMilkType,
      collectionDate: existingEntry.date,
    });
  } else {
    throw new ApiError(400, "Fat is required for calculation");
  }

  const newRateNum = new Decimal(calcResult.rate).toNumber();
  const newTotalAmountNum = new Decimal(calcResult.totalAmount).toNumber();

  const newCalcSnapshot = {
    rateChartId: calcResult.rateChartId,
    rateChartName: calcResult.rateChartName,
    calculationMethod: calcResult.method,
    appliedRate: new Decimal(calcResult.rate).toFixed(4),
    quantity: newQuantity.toFixed(2),
    appliedFat: new Decimal(calcResult.details.appliedFat).toFixed(2),
    appliedSnf: calcResult.details.appliedSnf ? new Decimal(calcResult.details.appliedSnf).toFixed(2) : null,
    baseRate: calcResult.details.baseRate ? new Decimal(calcResult.details.baseRate).toFixed(4) : null,
    fatAdjustment: calcResult.details.fatAdjustment ? new Decimal(calcResult.details.fatAdjustment).toFixed(4) : null,
    snfAdjustment: calcResult.details.snfAdjustment ? new Decimal(calcResult.details.snfAdjustment).toFixed(4) : null,
    formulaDescription: calcResult.details.formulaDescription || null,
    totalAmount: new Decimal(calcResult.totalAmount).toFixed(2),
    collectionDate: existingEntry.date.toISOString(),
    details: calcResult.details,
    correctedAt: new Date().toISOString(),
    correctionReason: payload.reason,
  };

  const updatedEntry = await prisma.$transaction(async (tx) => {
    const updated = await tx.milkEntry.update({
      where: { id },
      data: {
        quantity: newQuantity.toNumber(),
        fat: newFat ? newFat.toNumber() : existingEntry.fat,
        snf: newSnf ? newSnf.toNumber() : existingEntry.snf,
        milkType: newMilkType,
        rate: newRateNum,
        totalAmount: newTotalAmountNum,
        calculationSnapshot: newCalcSnapshot,
        isCorrected: true,
        correctionReason: payload.reason,
      } as any,
      include: {
        customer: true,
        rateChart: {
          select: {
            id: true,
            name: true,
            method: true,
            status: true,
          },
        },
      },
    });

    await MilkEntryAuditService.recordAudit(tx, {
      milkEntryId: id,
      adminId,
      customerId: existingEntry.customerId,
      rateChartId: existingEntry.rateChartId,
      action: "CORRECTED",
      originalValues: {
        quantity: Number(existingEntry.quantity),
        fat: existingEntry.fat ? Number(existingEntry.fat) : null,
        snf: existingEntry.snf ? Number(existingEntry.snf) : null,
        rate: existingEntry.rate ? Number(existingEntry.rate) : null,
        totalAmount: existingEntry.totalAmount ? Number(existingEntry.totalAmount) : null,
        milkType: existingEntry.milkType,
        rateChartId: existingEntry.rateChartId,
      },
      newValues: {
        quantity: newQuantity.toNumber(),
        fat: newFat ? newFat.toNumber() : null,
        snf: newSnf ? newSnf.toNumber() : null,
        rate: newRateNum,
        totalAmount: newTotalAmountNum,
        milkType: newMilkType,
        rateChartId: existingEntry.rateChartId,
      },
      reason: payload.reason,
      performedBy: adminId,
    });

    return updated;
  });

  // Invalidate caches
  try {
    const today = getTodayDate();
    const cacheKey = cacheKeys.todayMilkEntries(adminId, today);
    await cache.clearPattern(`milk-entries-by-date:${adminId}:*`);
    const cachedEntries = await cache.get<any[]>(cacheKey);
    if (cachedEntries) {
      const updatedCache = cachedEntries.map((e) => (e.id === id ? updatedEntry : e));
      await cache.set(cacheKey, updatedCache, TODAY_ENTRIES_CACHE_TTL);
    }
  } catch (err) {
    logger.warn("Cache update error after milk entry correction", { error: err });
  }

  return {
    ...updatedEntry,
    calculationSnapshot: newCalcSnapshot,
  };
};

/**
 * ========================================
 * UPDATE MILK ENTRY (Compatibility Guard)
 * Delegates to correctMilkEntry if calculation params change
 * ========================================
 */
const updateMilkEntry = async (adminId: string, id: string, payload: any) => {
  const calculationParamsChanged =
    payload.quantity !== undefined ||
    payload.fat !== undefined ||
    payload.snf !== undefined ||
    payload.milkType !== undefined;

  if (calculationParamsChanged) {
    if (!payload.reason || typeof payload.reason !== "string" || payload.reason.trim().length === 0) {
      throw new ApiError(400, "Correction reason is mandatory for modifying milk entry financial or measurement parameters");
    }
    return await correctMilkEntry(adminId, id, payload);
  }

  // Non-calculation field updates
  const existingEntry = await prisma.milkEntry.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!existingEntry) {
    throw new ApiError(404, "Milk entry not found");
  }

  if (existingEntry.customer.adminId !== adminId) {
    throw new ApiError(403, "Forbidden: You do not own this collection record");
  }

  const updatedEntry = await prisma.milkEntry.update({
    where: { id },
    data: payload,
    include: {
      customer: true,
      rateChart: {
        select: {
          id: true,
          name: true,
          method: true,
          status: true,
        },
      },
    },
  });

  return updatedEntry;
};

/**
 * ========================================
 * REVERSE MILK ENTRY (Safe Financial Reversal)
 * ========================================
 */
const reverseMilkEntry = async (adminId: string, id: string, reason: string) => {
  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    throw new ApiError(400, "Reversal reason is mandatory");
  }

  const existingEntry = await prisma.milkEntry.findUnique({
    where: { id },
    include: { customer: true, rateChart: true },
  });

  if (!existingEntry) {
    throw new ApiError(404, "Milk entry not found");
  }

  if (existingEntry.customer.adminId !== adminId) {
    throw new ApiError(403, "Forbidden: You do not own this collection record");
  }

  if ((existingEntry as any).isReversed) {
    throw new ApiError(400, "Milk entry is already reversed");
  }

  const reversedEntry = await prisma.$transaction(async (tx) => {
    const updated = await tx.milkEntry.update({
      where: { id },
      data: {
        isReversed: true,
        reversalReason: reason,
      } as any,
      include: {
        customer: true,
        rateChart: {
          select: {
            id: true,
            name: true,
            method: true,
            status: true,
          },
        },
      },
    });

    await MilkEntryAuditService.recordAudit(tx, {
      milkEntryId: id,
      adminId,
      customerId: existingEntry.customerId,
      rateChartId: existingEntry.rateChartId,
      action: "REVERSED",
      originalValues: {
        isReversed: false,
        totalAmount: existingEntry.totalAmount ? Number(existingEntry.totalAmount) : null,
      },
      newValues: {
        isReversed: true,
      },
      reason,
      performedBy: adminId,
    });

    return updated;
  });

  // Invalidate caches
  try {
    const today = getTodayDate();
    const cacheKey = cacheKeys.todayMilkEntries(adminId, today);
    await cache.clearPattern(`milk-entries-by-date:${adminId}:*`);
    const cachedEntries = await cache.get<any[]>(cacheKey);
    if (cachedEntries) {
      const updatedCache = cachedEntries.map((e) => (e.id === id ? reversedEntry : e));
      await cache.set(cacheKey, updatedCache, TODAY_ENTRIES_CACHE_TTL);
    }
  } catch (err) {
    logger.warn("Cache update error after milk entry reversal", { error: err });
  }

  return reversedEntry;
};

/**
 * ========================================
 * DELETE MILK ENTRY (Transactionally Audited)
 * ========================================
 */
const deleteMilkEntry = async (adminId: string, id: string, reason?: string) => {
  const existingEntry = await prisma.milkEntry.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!existingEntry) {
    logger.warn("MILK ENTRY NOT FOUND FOR DELETE", { id });
    throw new ApiError(404, "Milk entry not found");
  }

  // Tenant Isolation
  if (existingEntry.customer.adminId !== adminId) {
    throw new ApiError(403, "Forbidden: You do not own this collection record");
  }

  const deletedEntry = await prisma.$transaction(async (tx) => {
    await MilkEntryAuditService.recordAudit(tx, {
      milkEntryId: id,
      adminId,
      customerId: existingEntry.customerId,
      rateChartId: existingEntry.rateChartId,
      action: "DELETED",
      originalValues: {
        quantity: Number(existingEntry.quantity),
        fat: existingEntry.fat ? Number(existingEntry.fat) : null,
        snf: existingEntry.snf ? Number(existingEntry.snf) : null,
        rate: existingEntry.rate ? Number(existingEntry.rate) : null,
        totalAmount: existingEntry.totalAmount ? Number(existingEntry.totalAmount) : null,
        rateChartId: existingEntry.rateChartId,
        date: existingEntry.date,
        shift: existingEntry.shift,
      },
      newValues: null,
      reason: reason || "Milk entry deleted",
      performedBy: adminId,
    });

    return await tx.milkEntry.delete({
      where: { id },
    });
  });

  logger.warn("MILK_ENTRY_DELETED", {
    entryId: deletedEntry.id,
    adminId,
    customerId: existingEntry.customerId,
    totalAmount: existingEntry.totalAmount,
    rateChartId: existingEntry.rateChartId,
  });

  // Invalidate caches
  try {
    const today = getTodayDate();
    const cacheKey = cacheKeys.todayMilkEntries(adminId, today);
    await cache.clearPattern(`milk-entries-by-date:${adminId}:*`);
    const cachedEntries = await cache.get<any[]>(cacheKey);
    if (cachedEntries) {
      const filtered = cachedEntries.filter((e) => e.id !== id);
      await cache.set(cacheKey, filtered, TODAY_ENTRIES_CACHE_TTL);
    }
  } catch (err) {
    logger.warn("Cache error on delete", { error: err });
  }

  return deletedEntry;
};

// ========================================
// GET ALL MILK ENTRIES DAYWISE
// WITH REDIS CACHE (10 MINUTES)
// ========================================

const ALL_ENTRIES_CACHE_TTL =
  60 * 10;

/**
 * ========================================
 * GET ALL MILK ENTRIES DAYWISE
 * ========================================
 */

// ========================================
// GET MILK ENTRIES BY DATE
// ========================================

const getMilkEntriesByDate =
  async (
    adminId: string,
    date: string,
    page = 1,
    limit = 50
  ) => {

    /**
     * CACHE KEY
     */

    const cacheKey =
      cacheKeys.milkEntriesByDate(
        adminId,
        date,
        page,
        limit
      );

    /**
     * CACHE HIT
     */

    const cached =
      await cache.get<any>(
        cacheKey
      );

    if (cached) {

      logger.info(
        "REDIS HIT: MILK ENTRIES BY DATE",
        {
          adminId,

          date,

          cacheKey,
        }
      );

      return cached;
    }

    /**
     * DATE RANGE
     */

    const start =
      new Date(date);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(date);

    end.setHours(
      23,
      59,
      59,
      999
    );

    /**
     * PAGINATION
     */

    const skip =
      (page - 1) * limit;

    /**
     * FETCH ENTRIES
     */

    const entries =
      await prisma.milkEntry.findMany({
        where: {
          customer: {
            adminId,
          },

          date: {
            gte: start,

            lte: end,
          },
        },

        include: {
          customer: true,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        skip,

        take: limit,
      });

    /**
     * TOTAL
     */

    const totalEntries =
      await prisma.milkEntry.count({
        where: {
          customer: {
            adminId,
          },

          date: {
            gte: start,

            lte: end,
          },
        },
      });

    /**
     * RESPONSE
     */

    const response = {

      entries,

      pagination: {

        page,

        limit,

        totalEntries,

        totalPages:
          Math.ceil(
            totalEntries /
            limit
          ),
      },
    };

    /**
     * STORE CACHE
     */

    await cache.set(
      cacheKey,
      response,
      60 * 10
    );

    logger.info(
      "MILK ENTRIES BY DATE STORED IN REDIS",
      {
        adminId,

        date,

        cacheKey,
      }
    );

    return response;
  };

// ========================================
// GET MILK HISTORY (DATE RANGE & CUSTOMER)
// ========================================

const getMilkHistory = async (
  adminId: string,
  startDate?: string,
  endDate?: string,
  customerId?: string
) => {
  const whereClause: any = {
    customer: {
      adminId,
    },
  };

  if (customerId) {
    whereClause.customerId = customerId;
  }

  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.date.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.date.lte = end;
    }
  }

  const entries = await prisma.milkEntry.findMany({
    where: whereClause,
    include: {
      customer: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return entries;
};

export const milkEntryService = {
  getMilkHistory,
  getMilkEntriesByDate,
  getTodayMilkEntries,

  getSingleMilkEntry,

  createMilkEntry,

  updateMilkEntry,

  deleteMilkEntry,
};