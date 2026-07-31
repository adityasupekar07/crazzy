import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import * as controller
from "./advance.controller.js";

import {
  createAdvanceSchema,
  repaymentSchema,
  advanceIdParamSchema,
  customerIdParamSchema,
  getAllAdvancesQuerySchema,
}
from "./advance.schema.js";

const router = Router();

/**
 * =====================================================
 * CREATE ADVANCE
 * =====================================================
 */

router.post(
  "/",

  authMiddleware,

  validate({
    body:
      createAdvanceSchema,
  }),

  controller.createAdvance
);

/**
 * =====================================================
 * GET ALL ADVANCES
 * =====================================================
 */

  router.get(
    "/",

    authMiddleware,

    validate({
      query:
        getAllAdvancesQuerySchema,
    }),

    controller.getAllAdvances
  );

/**
 * =====================================================
 * GET ADVANCE BY ID
 * =====================================================
 */

router.get(
  "/:advanceId",

  authMiddleware,

  validate({
    params:
      advanceIdParamSchema,
  }),

  controller.getAdvanceById
);

/**
 * =====================================================
 * GET CUSTOMER ADVANCES
 * =====================================================
 */

router.get(
  "/customer/:customerId",

  authMiddleware,

  validate({
    params:
      customerIdParamSchema,
  }),

  controller.getCustomerAdvances
);

/**
 * =====================================================
 * ADD REPAYMENT
 * =====================================================
 */

router.post(
  "/:advanceId/repayments",

  authMiddleware,

  validate({
    params:
      advanceIdParamSchema,

    body:
      repaymentSchema,
  }),

  controller.addRepayment
);

export default router;