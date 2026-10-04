import { Router }
from "express";

import authMiddleware
from "../../middleware/auth.middleware.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    addCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    toggleCustomerStatus,
    debugCustomerApi
} from "./customer.controller.js";

import {
    addCustomerSchema,
    updateCustomerSchema
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

router.get(
    "/:id",
    authMiddleware,
    getCustomerById
);

router.patch(
    "/:id",
    authMiddleware,
    validate({ body: updateCustomerSchema }),
    updateCustomer
);

router.delete(
    "/:id",
    authMiddleware,
    toggleCustomerStatus
);

router.get(
  '/debug-test',

  authMiddleware,

  debugCustomerApi
);


export default router;