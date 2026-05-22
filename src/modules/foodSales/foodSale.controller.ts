import { Request, Response }
from "express";

import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import {
    createFoodSale,
    getAllFoodSales,
    getPendingFoodSales,
    updateFoodSale,
}
from "./foodSale.service.js";

/**
 * =====================================================
 * CREATE FOOD SALE
 * =====================================================
 */

export const createSale =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const sale =
                await createFoodSale(
                    adminId,
                    req.body
                );

            return res.status(201).json(
                new ApiResponse(
                    201,

                    "Food sale created successfully",

                    sale
                )
            );
        }
    );

/**
 * =====================================================
 * GET ALL SALES
 * =====================================================
 */

export const getSales =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const sales =
                await getAllFoodSales(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Food sales fetched successfully",

                    sales
                )
            );
        }
    );

/**
 * =====================================================
 * GET PENDING SALES
 * =====================================================
 */

export const getPendingSales =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const sales =
                await getPendingFoodSales(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Pending food sales fetched successfully",

                    sales
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE FOOD SALE
 * =====================================================
 */

export const updateSale =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const saleId =
                 String(req.params.saleId);

                

            const sale =
                await updateFoodSale(
                    adminId,
                    saleId,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Food sale updated successfully",

                    sale
                )
            );
        }
    );