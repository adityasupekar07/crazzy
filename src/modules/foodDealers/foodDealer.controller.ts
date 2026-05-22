import { Request, Response }
from "express";

import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import {
    createFoodDealer,
    updateFoodDealer,
    getAllFoodDealers,
}
from "./foodDealer.service.js";

/**
 * =====================================================
 * CREATE DEALER
 * =====================================================
 */

export const createDealer =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const dealer =
                await createFoodDealer(
                    adminId,
                    req.body
                );

            return res.status(201).json(
                new ApiResponse(
                    201,

                    "Dealer created successfully",

                    dealer
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE DEALER
 * =====================================================
 */

export const updateDealer =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const dealerId =
    String(req.params.dealerId);

            const dealer =
                await updateFoodDealer(
                    adminId,

                    dealerId,

                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Dealer updated successfully",

                    dealer
                )
            );
        }
    );

/**
 * =====================================================
 * GET ALL DEALERS
 * =====================================================
 */

export const getDealers =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const adminId =
                req.user.id;

            const dealers =
                await getAllFoodDealers(
                    adminId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,

                    "Dealers fetched successfully",

                    dealers
                )
            );
        }
    );