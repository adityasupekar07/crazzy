// ================================
// chart.controller.ts
// ================================

import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { RateChartService } from "./chart.service.js";

/**
 * CREATE DRAFT CHART
 */
const createRateChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.createRateChart(adminId, req.body);

  res.status(201).json(new ApiResponse(201, "Rate chart created in DRAFT status", result));
});

/**
 * GET ALL CHARTS (PAGINATED & FILTERED)
 */
const getAllCharts = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.getAllCharts(adminId, req.query);

  res.status(200).json(new ApiResponse(200, "Rate charts fetched successfully", result));
});

/**
 * GET ACTIVE CHART
 */
const getActiveChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const { milkType, method, chartType } = req.query;

  const result = await RateChartService.getActiveChart(
    adminId,
    milkType as string,
    method as string,
    chartType as string
  );

  res.status(200).json(new ApiResponse(200, "Active rate chart fetched successfully", result));
});

/**
 * GET SINGLE CHART
 */
const getSingleChart = asyncHandler(async (req: Request, res: Response) => {
  const result = await RateChartService.getSingleChart(req.params.id as string);

  res.status(200).json(new ApiResponse(200, "Rate chart fetched successfully", result));
});

/**
 * UPDATE DRAFT CHART
 */
const updateChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.updateChart(req.params.id as string, adminId, req.body);

  res.status(200).json(new ApiResponse(200, "Rate chart updated successfully", result));
});

/**
 * DELETE DRAFT CHART
 */
const deleteChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  await RateChartService.deleteChart(req.params.id as string, adminId);

  res.status(200).json(new ApiResponse(200, "Rate chart deleted successfully", null));
});

/**
 * ACTIVATE CHART
 */
const activateChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.activateChart(req.params.id as string, adminId);

  res.status(200).json(new ApiResponse(200, "Rate chart activated successfully", result));
});

/**
 * CLONE CHART
 */
const cloneChart = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.cloneChart(req.params.id as string, adminId);

  res.status(201).json(new ApiResponse(201, "Rate chart cloned as DRAFT successfully", result));
});

/**
 * PREVIEW CALCULATION (PURE MEMORY)
 */
const previewChart = asyncHandler(async (req: Request, res: Response) => {
  const result = await RateChartService.previewChart(req.body);

  res.status(200).json(new ApiResponse(200, "Rate calculation preview generated", result));
});

/**
 * VALIDATE EXCEL MATRIX (PURE MEMORY)
 */
const validateExcel = asyncHandler(async (req: Request, res: Response) => {
  const result = await RateChartService.validateExcel(req.body);

  res.status(200).json(new ApiResponse(200, "Excel matrix validated", result));
});

/**
 * CALCULATE RATE FOR ACTIVE CHART
 */
const calculateRate = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const result = await RateChartService.calculateLiveRate(adminId, req.body);

  res.status(200).json(new ApiResponse(200, "Rate calculated successfully", result));
});

export const RateChartController = {
  createRateChart,
  getAllCharts,
  getActiveChart,
  getSingleChart,
  updateChart,
  deleteChart,
  activateChart,
  cloneChart,
  previewChart,
  validateExcel,
  calculateRate,
};