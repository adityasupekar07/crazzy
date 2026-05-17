import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import adminRoutes from "../modules/Admin/admin.routes.js";
import customerRoutes from "../modules/customer/customer.route.js";
const router = Router();

/**
 * =====================================================
 * AUTH ROUTES
 * =====================================================
 */

router.use(
    "/auth",
    authRoutes
);

router.use(
    "/admin",
    adminRoutes
);
router.use(
    "/customer",
    customerRoutes
);

export default router;