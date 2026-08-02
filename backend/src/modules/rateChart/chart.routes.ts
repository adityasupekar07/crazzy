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
  getChartsQuerySchema,
  activeChartQuerySchema,
  previewChartSchema,
  validateExcelSchema,
  calculateRateSchema,
} from "./chart.schema.js";
import { RateChartController } from "./chart.controller.js";

const router = Router();

// Apply auth middleware to all rate chart routes
router.use(authMiddleware);

/**
 * RESTful CRUD & Query Endpoints
 */
router.post("/", validate(createChartSchema), RateChartController.createRateChart);
router.get("/", validate(getChartsQuerySchema), RateChartController.getAllCharts);
router.get("/active", validate(activeChartQuerySchema), RateChartController.getActiveChart);
router.get("/:id", validate(chartIdSchema), RateChartController.getSingleChart);
router.patch("/:id", validate(chartIdSchema), validate(updateChartSchema), RateChartController.updateChart);
router.delete("/:id", validate(chartIdSchema), RateChartController.deleteChart);

/**
 * Additional Business Routes
 */
router.post("/calculate", validate(calculateRateSchema), RateChartController.calculateRate);
router.post("/:id/activate", validate(chartIdSchema), RateChartController.activateChart);
router.post("/:id/clone", validate(chartIdSchema), RateChartController.cloneChart);
router.post("/preview", validate(previewChartSchema), RateChartController.previewChart);
router.post("/validate-excel", validate(validateExcelSchema), RateChartController.validateExcel);

/**
 * Backward-Compatibility Aliases
 */
router.post("/create", validate(createChartSchema), RateChartController.createRateChart);
router.get("/all", validate(getChartsQuerySchema), RateChartController.getAllCharts);

export default router;