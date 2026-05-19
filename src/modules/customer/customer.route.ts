import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    addCustomer,
    getCustomers,
} from "./customer.controller.js";

import {
    addCustomerSchema,
} from "./customer.schema.js";

const router = Router();

/**
 * =====================================================
 * ADD CUSTOMER
 * =====================================================
 */

router.post(
    "/create-new",

    authMiddleware,

    validate({
        body:
            addCustomerSchema,
    }),

    addCustomer
);

/**
 * =====================================================
 * GET CUSTOMERS
 * =====================================================
 */

router.get(
    "/all-customers",

    authMiddleware,

    getCustomers
);

export default router;