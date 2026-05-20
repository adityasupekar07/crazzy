import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import adminRoutes from "../modules/Admin/admin.routes.js";
import customerRoutes from "../modules/customer/customer.route.js";
import milkEntryRoutes from "../modules/milkEntry/milkEntry.route.js";
import rateChartRoutes from "../modules/rateChart/chart.routes.js";
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
router.use(
    "/milk",
    milkEntryRoutes
);
router.use(
    "/rate-chart",
    rateChartRoutes
);

export default router;