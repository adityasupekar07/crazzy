// ================================
// chart.routes.ts
// ================================

import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware.js";

import { validate } from "../../middleware/validate.middleware.js";

import {
  createChartSchema,
  updateChartSchema,
  chartIdSchema,
} from "./chart.schema.js";

import { RateChartController } from "./chart.controller.js";

const router = Router();

/**
 * CREATE CHART
 */

router.post(
  "/create",

  authMiddleware,

  validate(createChartSchema),

  RateChartController.createRateChart
);

/**
 * GET ALL CHARTS
 */

router.get(
  "/all",

  authMiddleware,

  RateChartController.getAllCharts
);

/**
 * GET ACTIVE CHART
 */

router.get(
  "/active",

  authMiddleware,

  RateChartController.getActiveChart
);

/**
 * GET SINGLE
 */

router.get(
  "/:id",

  authMiddleware,

  validate(chartIdSchema),

  RateChartController.getSingleChart
);

/**
 * UPDATE
 */

router.patch(
  "/:id",

  authMiddleware,

  validate(chartIdSchema),

  validate(updateChartSchema),

  RateChartController.updateChart
);

/**
 * DELETE
 */

router.delete(
  "/:id",

  authMiddleware,

  validate(chartIdSchema),

  RateChartController.deleteChart
);

export default router;