import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    createDealer,
    updateDealer,
    getDealers,
}
from "./foodDealer.controller.js";

import {
    createFoodDealerSchema,
    updateFoodDealerSchema,
}
from "./foodDealer.schema.js";

const router = Router();

/**
 * =====================================================
 * CREATE DEALER
 * =====================================================
 */

router.post(
    "/create-new-dealer",

    authMiddleware,

    validate({
        body:
            createFoodDealerSchema,
    }),

    createDealer
);

/**
 * =====================================================
 * UPDATE DEALER
 * =====================================================
 */

router.patch(
    "/update/:dealerId",

    authMiddleware,

    validate({
        body:
            updateFoodDealerSchema,
    }),

    updateDealer
);

/**
 * =====================================================
 * GET ALL DEALERS
 * =====================================================
 */

router.get(
    "/get-all-dealers",

    authMiddleware,

    getDealers
);

export default router;