import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    createSale,
    getSales,
    getPendingSales,
    updateSale,
}
from "./foodSale.controller.js";

import {
    createFoodSaleSchema,
    updateFoodSaleSchema,
}
from "./foodSale.schema.js";

const router = Router();

/**
 * =====================================================
 * CREATE SALE
 * =====================================================
 */

router.post(
    "/create",

    authMiddleware,

    validate({
        body:
            createFoodSaleSchema,
    }),

    createSale
);

/**
 * =====================================================
 * GET ALL SALES
 * =====================================================
 */

router.get(
    "/get-all-sales",

    authMiddleware,

    getSales
);

/**
 * =====================================================
 * GET PENDING SALES
 * =====================================================
 */

router.get(
    "/pending",

    authMiddleware,

    getPendingSales
);

/**
 * =====================================================
 * UPDATE FOOD SALE
 * =====================================================
 */

router.patch(
    "/:saleId",

    authMiddleware,

    validate({
        body:
            updateFoodSaleSchema,
    }),

    updateSale
);

export default router;