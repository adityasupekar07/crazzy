import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    createPurchase,
    getPurchases,
    getInStockItems,
    getOutStockItems,
}
from "./foodPurchase.controller.js";

import {
    createFoodPurchaseSchema,
}
from "./foodPurchase.schema.js";

const router = Router();

/**
 * =====================================================
 * CREATE PURCHASE
 * =====================================================
 */

router.post(
    "/create",

    authMiddleware,

    validate({
        body:
            createFoodPurchaseSchema,
    }),

    createPurchase
);

/**
 * =====================================================
 * GET ALL PURCHASES
 * =====================================================
 */

router.get(
    "/all-purchases",

    authMiddleware,

    getPurchases
);

/**
 * =====================================================
 * GET AVAILABLE STOCK
 * =====================================================
 */

router.get(
    "/in-stock",

    authMiddleware,

    getInStockItems
);

/**
 * =====================================================
 * GET OUT OF STOCK
 * =====================================================
 */

router.get(
    "/out-of-stock",

    authMiddleware,

    getOutStockItems
);

export default router;