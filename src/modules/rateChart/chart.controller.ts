import { Request, Response } from "express";

import asyncHandler from "../../utils/asyncHandler.js";

import ApiResponse from "../../utils/ApiResponse.js";

import {
  createRateChartService,
  addMatrixRatesService,
  getRateChartService,
} from "./chart.service.js";

export const createRateChartController =
  asyncHandler(async (req, res) => {
    const adminId = req.user.id;

    const chart =
      await createRateChartService(
        adminId,
        req.body
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        "Rate chart created",
        chart
      )
    );
  });

export const addMatrixRatesController =
  asyncHandler(async (req, res) => {
    await addMatrixRatesService(
      req.body.rateChartId,
      req.body.rates
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        "Matrix rates added"
      )
    );
  });

export const getRateChartController =
  asyncHandler(async (req, res) => {
    const chart =
      await getRateChartService(
        req.params.id as string
      );

    return res.json(
      new ApiResponse(
        200,
        "Rate chart fetched",
        chart
      )
    );
  });