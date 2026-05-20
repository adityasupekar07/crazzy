import { Router } from "express";

import {
  createRateChartController,
  addMatrixRatesController,
  getRateChartController,
} from "./chart.controller.js";

import { validate } from "../../middleware/validate.middleware.js";

import {
  createRateChartSchema,
  createMatrixRatesSchema,
} from "./chart.schema.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import { auth } from "firebase-admin";

const router = Router();

router.post(
  "/",
  validate({
    body: createRateChartSchema,
  }),
  authMiddleware
  ,
  createRateChartController
);

router.post(
  "/matrix",
  validate({
    body: createMatrixRatesSchema,
  }),
  authMiddleware,
  addMatrixRatesController
);

router.get(
  "/:id",
  getRateChartController
);

export default router;