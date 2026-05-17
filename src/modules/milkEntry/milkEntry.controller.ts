import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import * as milkEntryService
from "./milkEntry.service.js";

/**
 * =====================================================
 * ADD MILK ENTRY
 * =====================================================
 */

export const addMilkEntry =
    asyncHandler(
        async (req, res) => {

            const result =
                await milkEntryService.addMilkEntry(
                    req.body
                );

            return res.status(201).json(
                new ApiResponse(
                    201,
                    "Milk entry added successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * GET CUSTOMER ENTRIES
 * =====================================================
 */

export const getCustomerMilkEntries =
    asyncHandler(
        async (req, res) => {

           const customerId =
    String(
        req.params.customerId
    );
            const page =
                Number(req.query.page) || 1;

            const limit =
                Number(req.query.limit) || 20;

            const result =
                await milkEntryService.getCustomerMilkEntries(
                    customerId,
                    page,
                    limit
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Milk entries fetched successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * GET SINGLE ENTRY
 * =====================================================
 */

export const getMilkEntryById =
    asyncHandler(
        async (req, res) => {

            const id =
                String(
                    req.params.id
                );

            const result =
                await milkEntryService.getMilkEntryById(
                    id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Milk entry fetched successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * UPDATE ENTRY
 * =====================================================
 */

export const updateMilkEntry =
    asyncHandler(
        async (req, res) => {

           const id=String(
            req.params.id
           );
            const result =
                await milkEntryService.updateMilkEntry(
                    id,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Milk entry updated successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * DELETE ENTRY
 * =====================================================
 */

export const deleteMilkEntry =
    asyncHandler(
        async (req, res) => {

            const id=String(
                req.params.id
            );
            const result =
                await milkEntryService.deleteMilkEntry(
                    id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Milk entry deleted successfully",
                    result
                )
            );
        }
    );