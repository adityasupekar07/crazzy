import {prisma} from "./../../config/prisma.js";

import ApiError from "../../utils/ApiError.js";

export const createRateChartService =
  async (
    adminId: string,
    payload: any
  ) => {
    const chart =
      await prisma.rateChart.create({
        data: {
          name: payload.name,

          type: payload.type,

          milkType: payload.milkType,

          shift: payload.shift,

          isDefault:
            payload.isDefault || false,

          adminId,

          rule: payload.rule
            ? {
                create: payload.rule,
              }
            : undefined,
        },

        include: {
          rule: true,
        },
      });

    return chart;
  };

export const addMatrixRatesService =
  async (
    rateChartId: string,
    rates: any[]
  ) => {
    const chart =
      await prisma.rateChart.findUnique({
        where: {
          id: rateChartId,
        },
      });

    if (!chart) {
      throw new ApiError(
        404,
        "Rate chart not found"
      );
    }

    await prisma.rateMatrix.createMany({
      data: rates.map((row) => ({
        rateChartId,

        fat: row.fat,

        snf: row.snf,

        rate: row.rate,
      })),

      skipDuplicates: true,
    });

    return true;
  };

export const getRateChartService =
  async (chartId: string) => {
    return prisma.rateChart.findUnique({
      where: {
        id: chartId,
      },

      include: {
        rule: true,

        matrixRates: true,
      },
    });
  };