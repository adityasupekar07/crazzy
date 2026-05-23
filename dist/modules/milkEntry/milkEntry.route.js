import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { addMilkEntry, getMilkEntryById, updateMilkEntry, deleteMilkEntry, getTodayMilkEntries, getMilkEntriesByDate, } from "./milkEntry.controller.js";
import { addMilkEntrySchema, updateMilkEntrySchema, } from "./milkEntry.schema.js";
const router = Router();
/**
 * =====================================================
 * ADD MILK ENTRY
 * =====================================================
 */
router.post("/milk-entry", authMiddleware, validate({
    body: addMilkEntrySchema,
}), addMilkEntry);
router.get("/today", authMiddleware, getTodayMilkEntries);
/**
 * =====================================================
 * GET CUSTOMER MILK ENTRIES
 * =====================================================
 */
// router.get(
//     "/customer/:customerId",
//     authMiddleware,
//     getCustomerMilkEntries
// );
/**
 * =====================================================
 * GET SINGLE ENTRY
 * =====================================================
 */
router.get("/:id", authMiddleware, getMilkEntryById);
router.get("/milk-entry/by-date", authMiddleware, getMilkEntriesByDate);
/**
 * =====================================================
 * UPDATE ENTRY
 * =====================================================
 */
router.patch("/:id", authMiddleware, validate({
    body: updateMilkEntrySchema,
}), updateMilkEntry);
/**
 * =====================================================
 * DELETE ENTRY
 * =====================================================
 */
router.delete("/:id", authMiddleware, deleteMilkEntry);
export default router;
