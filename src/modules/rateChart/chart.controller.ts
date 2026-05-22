import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { RateChartService } from "./chart.service.js";
import { Request, Response } from "express";
const createRateChart = asyncHandler(
  async (req, res) => {
    const adminId = req.user.id;

    const result =
      await RateChartService.createRateChart(
        adminId,
        req.body
      );

    res.status(201).json(
      new ApiResponse(
        201,
        "Rate chart created",
        result
      )
    );
  }
);

const getAllCharts = asyncHandler(
  async (req, res ) => {
    const adminId = req.user.id;

    const result =
      await RateChartService.getAllCharts(
        adminId
      );

    res.status(200).json(
      new ApiResponse(
        200,
      
        "Charts fetched",
          result
      )
    );
  }
);

const getSingleChart = asyncHandler(
  async (req, res) => {
    const result =
      await RateChartService.getSingleChart(
        req.params.id as string
      );

    res.status(200).json(
      new ApiResponse(
        200,
        "Chart fetched",
        result
      )
    );
  }
);

const updateChart = asyncHandler(
  async (req, res) => {
    const result =
      await RateChartService.updateChart(
        req.params.id as string,
        req.body
      );

    res.status(200).json(
      new ApiResponse(
        200,
        "Chart updated",
        result
      )
    );
  }
);

const deleteChart = asyncHandler(
  async (req, res) => {
    await RateChartService.deleteChart(
      req.params.id as string
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "null",
        "Chart deleted"
      )
    );
  }
);

export const RateChartController = {
  createRateChart,
  getAllCharts,
  getSingleChart,
  updateChart,
  deleteChart,
};