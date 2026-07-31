// ================================
// chart.service.ts
// ================================

import prisma from "../../db/index.js";
import { cache } from "../../services/cache.service.js";

import { cacheKeys } from "../../utils/cacheKeys.js";
/**
 * CREATE
 */

const createRateChart = async (
  adminId: string,
  payload: any
) => {

  return prisma.$transaction(
    async (tx) => {

      /**
       * DEACTIVATE OLD ACTIVE CHARTS
       */

      await tx.rateChart.updateMany({
        where: {
          adminId,

          milkType:
            payload.milkType,

          category:
            payload.category,

          method:
            payload.method,

          isActive: true,
        },

        data: {
          isActive: false,
        },
      });

      /**
 * CLEAR OLD CACHE
 */

await cache.del(
  cacheKeys.allCharts(
    adminId
  )
);

await cache.del(
  cacheKeys.activeChart(
    adminId,
    payload.milkType,
    payload.category,
    payload.method
  )
);


      /**
       * CREATE NEW ACTIVE CHART
       */

      const chart =
        await tx.rateChart.create({
          data: {
            name:
              payload.name,

            milkType:
              payload.milkType,

            category:
              payload.category,

            chartType:
              payload.chartType,

            method:
              payload.method,

            baseRate:
              payload.baseRate,

            adminId,

            isActive: true,

            effectiveFrom:
              payload.effectiveFrom,

            fatSteps: {
              create:
                payload.fatSteps,
            },

            snfSteps: {
              create:
                payload.snfSteps,
            },

            rules: {
              create:
                payload.rules || [],
            },
          },

          include: {
            fatSteps: true,

            snfSteps: true,

            rules: true,
          },
        });
        /**
 * SET NEW ACTIVE CACHE
 */

await cache.set(
  cacheKeys.activeChart(
    adminId,
    payload.milkType,
    payload.category,
    payload.method
  ),
  chart
);

      return chart;
    }
  );
};

/**
 * GET ALL
 */

// const getAllCharts = async (
//   adminId: string
// ) => {

//   return prisma.rateChart.findMany({
//     where: {
//       adminId,
//     },

//     include: {
//       fatSteps: true,

//       snfSteps: true,

//       rules: true,
//     },

//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// };

const getAllCharts = async (
  adminId: string
) => {

  const cacheKey =
    cacheKeys.allCharts(
      adminId
    );

  /**
   * CACHE HIT
   */

  const cached =
    await cache.get(cacheKey);

  if (cached) {

    console.log(
      "REDIS HIT: ALL CHARTS"
    );

    return cached;
  }

  /**
   * DB QUERY
   */

  const charts =
    await prisma.rateChart.findMany({
      where: {
        adminId,
      },

      include: {
        fatSteps: true,

        snfSteps: true,

        rules: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  /**
   * STORE CACHE
   */

  await cache.set(
    cacheKey,
    charts,
    60 * 10
  );

  return charts;
};
/**
 * GET ACTIVE
 */

const getActiveChart = async (
  adminId: string,
  milkType: string,
  category: string,
  method: string
) => {

  const cacheKey =
    cacheKeys.activeChart(
      adminId,
      milkType,
      category,
      method
    );

  /**
   * CACHE HIT
   */

  const cached =
    await cache.get(cacheKey);

  if (cached) {

    console.log(
      "REDIS HIT: ACTIVE CHART"
    );

    return cached;
  }

  /**
   * DB QUERY
   */

  const chart =
    await prisma.rateChart.findFirst({
      where: {
        adminId,

        milkType:
          milkType as any,

        category:
          category as any,

        method:
          method as any,

        isActive: true,
      },

      include: {
        fatSteps: true,

        snfSteps: true,

        rules: true,
      },
    });

  /**
   * STORE CACHE
   */

  if (chart) {

    await cache.set(
      cacheKey,
      chart,
      60 * 60
    );
  }

  return chart;
};

/**
 * GET SINGLE
 */

const getSingleChart = async (
  id: string
) => {

  const cacheKey =
    cacheKeys.singleChart(id);

  /**
   * CACHE HIT
   */

  const cached =
    await cache.get(cacheKey);

  if (cached) {

    console.log(
      "REDIS HIT: SINGLE CHART"
    );

    return cached;
  }

  /**
   * DB QUERY
   */

  const chart =
    await prisma.rateChart.findUnique({
      where: {
        id,
      },

      include: {
        fatSteps: true,

        snfSteps: true,

        rules: true,
      },
    });

  /**
   * STORE CACHE
   */

  if (chart) {

    await cache.set(
      cacheKey,
      chart
    );
  }

  return chart;
};

/**
 * UPDATE
 */

const updateChart = async (
  id: string,
  payload: any
) => {

  /**
   * DELETE OLD STEPS
   */

  await prisma.fatStep.deleteMany({
    where: {
      rateChartId: id,
    },
  });

  await prisma.snfStep.deleteMany({
    where: {
      rateChartId: id,
    },
  });

  await prisma.bonusPenaltyRule.deleteMany({
    where: {
      rateChartId: id,
    },
  });
await cache.del(
  cacheKeys.singleChart(id)
);
await cache.clearPattern(
  "active-chart:*"
);
  /**
   * UPDATE
   */

  return prisma.rateChart.update({
    where: {
      id,
    },

    data: {
      name:
        payload.name,

      baseRate:
        payload.baseRate,

      fatSteps: {
        create:
          payload.fatSteps,
      },

      snfSteps: {
        create:
          payload.snfSteps,
      },

      rules: {
        create:
          payload.rules || [],
      },
    },

    include: {
      fatSteps: true,

      snfSteps: true,

      rules: true,
    },
  });
};

/**
 * DELETE
 */

const deleteChart = async (
  id: string
) => {
await cache.del(
  cacheKeys.singleChart(id)
);

await cache.clearPattern(
  "all-charts:*"
);

await cache.clearPattern(
  "active-chart:*"
);
  return prisma.rateChart.delete({
    where: {
      id,
    },


  });

};

export const RateChartService = {
  createRateChart,

  getAllCharts,

  getActiveChart,

  getSingleChart,

  updateChart,

  deleteChart,
};