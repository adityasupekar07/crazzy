import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    addMilkEntry,
    getCustomerMilkEntries,
    getMilkEntryById,
    updateMilkEntry,
    deleteMilkEntry,
} from "./milkEntry.controller.js";

import {
    addMilkEntrySchema,
    updateMilkEntrySchema,
} from "./milkEntry.schema.js";

const router = Router();

/**
 * =====================================================
 * ADD MILK ENTRY
 * =====================================================
 */

router.post(
    "/milk-entry",

    authMiddleware,

    validate({
        body:
            addMilkEntrySchema,
    }),

    addMilkEntry
);

/**
 * =====================================================
 * GET CUSTOMER MILK ENTRIES
 * =====================================================
 */

router.get(
    "/customer/:customerId",

    authMiddleware,

    getCustomerMilkEntries
);

/**
 * =====================================================
 * GET SINGLE ENTRY
 * =====================================================
 */

router.get(
    "/:id",

    authMiddleware,

    getMilkEntryById
);

/**
 * =====================================================
 * UPDATE ENTRY
 * =====================================================
 */

router.patch(
    "/:id",

    authMiddleware,

    validate({
        body:
            updateMilkEntrySchema,
    }),

    updateMilkEntry
);

/**
 * =====================================================
 * DELETE ENTRY
 * =====================================================
 */

router.delete(
    "/:id",

    authMiddleware,

    deleteMilkEntry
);

export default router;