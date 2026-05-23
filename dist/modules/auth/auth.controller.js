import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";
/**
 * =====================================================
 * VERIFY PHONE
 * =====================================================
 */
export const verifyPhone = asyncHandler(async (req, res) => {
    const result = await authService.verifyPhone(req.body);
    return res.status(200).json(new ApiResponse(200, "Phone verified successfully", result));
});
/**
 * =====================================================
 * REGISTER
 * =====================================================
 */
export const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return res.status(201).json(new ApiResponse(201, "Admin registered successfully", result));
});
/**
 * =====================================================
 * LOGIN
 * =====================================================
 */
export const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return res.status(200).json(new ApiResponse(200, "Login successful", result));
});
