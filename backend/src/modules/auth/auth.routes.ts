import { Router } from "express";

import {
    verifyPhone,
    register,
    login,
} from "./auth.controller.js";

import { validate }
from "../../middleware/validate.middleware.js";

import {
    verifyPhoneSchema,
    registerSchema,
    loginSchema,
} from "./auth.validate.schema.js";

const router = Router();

router.post(
    "/verify-phone",

    validate({
        body:
            verifyPhoneSchema,
    }),

    verifyPhone
);

router.post(
    "/register",

    validate({
        body:
            registerSchema,
    }),

    register
);

router.post(
    "/login",

    validate({
        body:
            loginSchema,
    }),

    login
);

export default router;