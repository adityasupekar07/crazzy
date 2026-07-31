import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import * as advanceService
from "./advance.service.js";

/**
 * =====================================================
 * CREATE ADVANCE
 * =====================================================
 */

export const createAdvance =
  asyncHandler(
    async (req, res) => {

      const result =
        await advanceService.createAdvance(
          req.body,
          req.user.id
        );

      return res.status(201).json(
        new ApiResponse(
          201,
          "Advance created successfully",
          result
        )
      );
    }
  );

/**
 * =====================================================
 * GET ALL ADVANCES
 * =====================================================
 */

export const getAllAdvances =
  asyncHandler(
    async (req, res) => {

      const result =
        await advanceService.getAllAdvances(
          req.query,
          req.user.id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          "Advances fetched successfully",
          result
        )
      );
    }
  );

/**
 * =====================================================
 * GET ADVANCE BY ID
 * =====================================================
 */

export const getAdvanceById =
  asyncHandler(
    async (req, res) => {

      const result =
        await advanceService.getAdvanceById(
          req.params.advanceId as string,
          req.user.id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          "Advance fetched successfully",
          result
        )
      );
    }
  );

/**
 * =====================================================
 * GET CUSTOMER ADVANCES
 * =====================================================
 */

export const getCustomerAdvances =
  asyncHandler(
    async (req, res) => {

      const result =
        await advanceService.getCustomerAdvances(
          req.params.customerId as string,
          req.user.id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          "Customer advances fetched successfully",
          result
        )
      );
    }
  );

/**
 * =====================================================
 * ADD REPAYMENT
 * =====================================================
 */

export const addRepayment =
  asyncHandler(
    async (req, res) => {

      const result =
        await advanceService.addRepayment(
          req.params.advanceId as string,
          req.body,
          req.user.id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          "Repayment added successfully",
          result
        )
      );
    }
  );