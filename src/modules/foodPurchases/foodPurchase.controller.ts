import { Request, Response }
from "express";

import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import {
    createFoodPurchase,
    getAllFoodPurchases,
    getAvailableStock,
    getOutOfStockItems,
}
from "./foodPurchase.service.js";

/**
 * =====================================================
 * CREATE FOOD PURCHASE
 * =====================================================
 */

export const createPurchase =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const purchase =
                await createFoodPurchase(
                    adminId,
                    req.body
                );

            return res.status(201).json(
                new ApiResponse(
                    201,

                    "Food purchase created successfully",

                    purchase
                )
            );
        }
    );

/**
 * =====================================================
 * GET ALL PURCHASES
 * =====================================================
 */

export const getPurchases =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const purchases =
                await getAllFoodPurchases(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Food purchases fetched successfully",

                    purchases
                )
            );
        }
    );

/**
 * =====================================================
 * GET AVAILABLE STOCK
 * =====================================================
 */

export const getInStockItems =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const stock =
                await getAvailableStock(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Available stock fetched successfully",

                    stock
                )
            );
        }
    );

/**
 * =====================================================
 * GET OUT OF STOCK ITEMS
 * =====================================================
 */

export const getOutStockItems =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const stock =
                await getOutOfStockItems(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Out of stock items fetched successfully",

                    stock
                )
            );
        }
    );