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

const getSingleMilkEntry =
  async (
    id: string
  ) => {

    const entry =
      await prisma.milkEntry.findUnique({
        where: {
          id,
        },

        include: {
          customer: true,
        },
      });

    /**
     * NOT FOUND
     */

    if (!entry) {

      logger.warn(
        "MILK ENTRY NOT FOUND",
        { id }
      );

      throw new ApiError(
        404,
        "Milk entry not found"
      );
    }

    return entry;
  };

/**
 * ========================================
 * CREATE ENTRY
 * ========================================
 */

// ========================================
// CREATE MILK ENTRY
// ========================================

const createMilkEntry = async (adminId: string, payload: any) => {
  logger.info("[SERVICE START] createMilkEntry", { adminId, payload });

  /**
   * VALIDATION
   */
  if (!payload.code) {
    logger.warn("CUSTOMER CODE MISSING");
    throw new ApiError(400, "Customer code is required");
  }

  /**
   * FIND CUSTOMER USING ADMIN ID + CODE
   */
  const customer = await prisma.customer.findFirst({
    where: {
      adminId,
      code: payload.code,
    },
  });

  if (!customer) {
    logger.warn("CUSTOMER NOT FOUND", { adminId, code: payload.code });
    throw new ApiError(404, "Customer not found");
  }

  const entryDate = getTodayStart();

  /**
   * CHECK EXISTING ENTRY SAME DATE + SHIFT
   */
  logger.info("[BEFORE DUPLICATE CHECK]", { customerId: customer.id, shift: payload.shift });

  const existingEntry = await prisma.milkEntry.findFirst({
    where: {
      customerId: customer.id,
      shift: payload.shift,
      date: {
        gte: getTodayStart(),
        lte: getTodayEnd(),
      },
    },
  });

  if (existingEntry) {
    logger.warn("ENTRY ALREADY EXISTS", { customerId: customer.id, shift: payload.shift });
    throw new ApiError(400, `Entry for ${payload.shift} shift already exists on this date`);
  }

  logger.info("[AFTER DUPLICATE CHECK - PASSED]");

  /**
   * CREATE ENTRY IN POSTGRESQL DB
   */
  const newEntry = await prisma.milkEntry.create({
    data: {
      customerId: customer.id,
      date: entryDate,
      shift: payload.shift,
      milkType: payload.milkType,
      quantity: payload.quantity,
      fat: payload.fat,
      snf: payload.snf,
      rate: payload.rate,
      totalAmount: payload.totalAmount,
    },
    include: {
      customer: true,
    },
  });

  logger.info("[AFTER DB CREATE - SUCCESS]", { entryId: newEntry.id, customerId: customer.id });

  /**
   * CACHE UPDATES (NON-BLOCKING FAIL-SAFE)
   */
  logger.info("[BEFORE CACHE OPERATIONS]");
  try {
    const today = getTodayDate();
    const cacheKey = cacheKeys.todayMilkEntries(adminId, today);
    const cachedEntries = await cache.get<any[]>(cacheKey);

    if (cachedEntries) {
      logger.info("UPDATING TODAY ENTRIES CACHE", { cacheKey });
      cachedEntries.unshift(newEntry);
      await cache.set(cacheKey, cachedEntries, TODAY_ENTRIES_CACHE_TTL);
    }

    await cache.clearPattern(`milk-entries-by-date:${adminId}:*`);
    logger.info("[AFTER CACHE OPERATIONS - SUCCESS]");
  } catch (cacheErr) {
    logger.warn("[CACHE OPERATIONS FAILED - GRACEFULLY IGNORED]", { error: cacheErr });
  }

  logger.info("[BEFORE RETURN - SUCCESS]", { entryId: newEntry.id });
  return newEntry;
};
/**
 * ========================================
 * UPDATE ENTRY
 * ========================================
 */

const updateMilkEntry =
  async (
    adminId: string,
    id: string,
    payload: any
  ) => {

    /**
     * CHECK EXISTING
     */

    const existingEntry =
      await prisma.milkEntry.findUnique({
        where: {
          id,
        },
      });

    if (!existingEntry) {

      logger.warn(
        "MILK ENTRY NOT FOUND FOR UPDATE",
        { id }
      );

      throw new ApiError(
        404,
        "Milk entry not found"
      );
    }

    /**
     * UPDATE DATABASE
     */

    const updatedEntry =
      await prisma.milkEntry.update({
        where: {
          id,
        },

        data: {
          quantity:
            payload.quantity,

          fat:
            payload.fat,

          snf:
            payload.snf,

          rate:
            payload.rate,

          totalAmount:
            payload.totalAmount,
        },

        include: {
          customer: true,
        },
      });

    logger.info(
      "MILK ENTRY UPDATED",
      {
        entryId:
          updatedEntry.id,

        adminId,
      }
    );

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
    await cache.clearPattern(
      `milk-entries-by-date:${adminId}:*`
    );
    /**
     * GET CACHE
     */

    const cachedEntries =
      await cache.get<any[]>(
        cacheKey
      );

    /**
     * UPDATE CACHE
     */

    if (cachedEntries) {

      logger.info(
        "UPDATING REDIS CACHE AFTER UPDATE",
        {
          cacheKey,

          entryId:
            updatedEntry.id,
        }
      );

      const updatedCache =
        cachedEntries.map(
          (entry) => {

            if (
              entry.id === id
            ) {
              return updatedEntry;
            }

            return entry;
          }
        );

      /**
       * SAVE CACHE
       */

      await cache.set(
        cacheKey,
        updatedCache,
        TODAY_ENTRIES_CACHE_TTL
      );
    }

    return updatedEntry;
  };

/**
 * ========================================
 * DELETE ENTRY
 * ========================================
 */

const deleteMilkEntry =
  async (
    adminId: string,
    id: string
  ) => {

    /**
     * CHECK EXISTING
     */

    const existingEntry =
      await prisma.milkEntry.findUnique({
        where: {
          id,
        },
      });

    if (!existingEntry) {

      logger.warn(
        "MILK ENTRY NOT FOUND FOR DELETE",
        { id }
      );

      throw new ApiError(
        404,
        "Milk entry not found"
      );
    }

    /**
     * DELETE DATABASE ENTRY
     */

    const deletedEntry =
      await prisma.milkEntry.delete({
        where: {
          id,
        },
      });

    logger.info(
      "MILK ENTRY DELETED",
      {
        entryId:
          deletedEntry.id,

        adminId,
      }
    );

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

    await cache.clearPattern(
      `milk-entries-by-date:${adminId}:*`
    );
    /**
     * GET CACHE
     */

    const cachedEntries =
      await cache.get<any[]>(
        cacheKey
      );

    /**
     * REMOVE FROM CACHE
     */

    if (cachedEntries) {

      logger.info(
        "REMOVING ENTRY FROM REDIS CACHE",
        {
          cacheKey,

          entryId:
            deletedEntry.id,
        }
      );

      const filteredEntries =
        cachedEntries.filter(
          (entry) =>
            entry.id !== id
        );

      /**
       * SAVE CACHE
       */

      await cache.set(
        cacheKey,
        filteredEntries,
        TODAY_ENTRIES_CACHE_TTL
      );
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
      rateChart: true,
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