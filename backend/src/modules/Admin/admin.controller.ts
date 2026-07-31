import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import * as adminService
from "./admin.service.js";

/**
 * =====================================================
 * GET PROFILE
 * =====================================================
 */

export const getProfile =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.getProfile(
                    req.user.id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Profile fetched successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE PROFILE
 * =====================================================
 */

export const updateProfile =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.updateProfile(
                    req.user.id,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Profile updated successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE DAIRY INFO
 * =====================================================
 */

export const updateDairyInfo =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.updateDairyInfo(
                    req.user.id,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Dairy info updated successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE SETTINGS
 * =====================================================
 */

export const updateSettings =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.updateSettings(
                    req.user.id,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Settings updated successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * CHANGE PASSWORD
 * =====================================================
 */

export const changePassword =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.changePassword(
                    req.user.id,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Password changed successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * DASHBOARD
 * =====================================================
 */

export const getDashboard =
    asyncHandler(
        async (req, res) => {

            const result =
                await adminService.getDashboard(
                    req.user.id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Dashboard fetched successfully",
                    result
                )
            );
        }
    );