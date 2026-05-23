import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { getProfile, updateProfile, updateDairyInfo, updateSettings, changePassword, getDashboard, } from "./admin.controller.js";
import { updateProfileSchema, updateDairyInfoSchema, updateSettingsSchema, changePasswordSchema, } from "./admin.schema.js";
const router = Router();
/**
 * =====================================================
 * GET PROFILE
 * =====================================================
 */
router.get("/profile", authMiddleware, getProfile);
/**
 * =====================================================
 * UPDATE PROFILE
 * =====================================================
 */
router.patch("/profile", authMiddleware, validate({
    body: updateProfileSchema,
}), updateProfile);
/**
 * =====================================================
 * UPDATE DAIRY INFO
 * =====================================================
 */
router.patch("/dairy-info", authMiddleware, validate({
    body: updateDairyInfoSchema,
}), updateDairyInfo);
/**
 * =====================================================
 * UPDATE SETTINGS
 * =====================================================
 */
router.patch("/settings", authMiddleware, validate({
    body: updateSettingsSchema,
}), updateSettings);
/**
 * =====================================================
 * CHANGE PASSWORD
 * =====================================================
 */
router.patch("/change-password", authMiddleware, validate({
    body: changePasswordSchema,
}), changePassword);
/**
 * =====================================================
 * DASHBOARD
 * =====================================================
 */
router.get("/dashboard", authMiddleware, getDashboard);
export default router;
