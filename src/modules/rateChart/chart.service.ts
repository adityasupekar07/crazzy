import prisma from "../../db/index.js";

const createRateChart = async (
  adminId: string,
  payload: any
) => {
  return prisma.rateChart.create({
    data: {
      name: payload.name,

      milkType: payload.milkType,

      category: payload.category,

      chartType: payload.chartType,

      method: payload.method,

      baseRate: payload.baseRate,

      adminId,

      fatSteps: {
        create: payload.fatSteps,
      },

      snfSteps: {
        create: payload.snfSteps,
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
};

const getAllCharts = async (
  adminId: string
) => {
  return prisma.rateChart.findMany({
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
};

const getSingleChart = async (
  id: string
) => {
  return prisma.rateChart.findUnique({
    where: {
      id,
    },

    include: {
      fatSteps: true,
      snfSteps: true,
      rules: true,
    },
  });
};

const updateChart = async (
  id: string,
  payload: any
) => {
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

  return prisma.rateChart.update({
    where: {
      id,
    },

    data: {
      name: payload.name,

      baseRate: payload.baseRate,

      fatSteps: {
        create: payload.fatSteps,
      },

      snfSteps: {
        create: payload.snfSteps,
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
};

const deleteChart = async (
  id: string
) => {
  return prisma.rateChart.delete({
    where: {
      id,
    },
  });
};

export const RateChartService = {
  createRateChart,
  getAllCharts,
  getSingleChart,
  updateChart,
  deleteChart,
};