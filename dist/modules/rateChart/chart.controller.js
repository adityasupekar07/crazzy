// ================================
// chart.controller.ts
// ================================
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { RateChartService } from "./chart.service.js";
/**
 * CREATE
 */
const createRateChart = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const result = await RateChartService.createRateChart(adminId, req.body);
    res.status(201).json(new ApiResponse(201, "Rate chart created", result));
});
/**
 * GET ALL
 */
const getAllCharts = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const result = await RateChartService.getAllCharts(adminId);
    res.status(200).json(new ApiResponse(200, "Charts fetched", result));
});
/**
 * GET ACTIVE
 */
const getActiveChart = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { milkType, category, method, } = req.query;
    const result = await RateChartService.getActiveChart(adminId, milkType, category, method);
    res.status(200).json(new ApiResponse(200, "Active chart fetched", result));
});
/**
 * GET SINGLE
 */
const getSingleChart = asyncHandler(async (req, res) => {
    const result = await RateChartService.getSingleChart(req.params.id);
    res.status(200).json(new ApiResponse(200, "Chart fetched", result));
});
/**
 * UPDATE
 */
const updateChart = asyncHandler(async (req, res) => {
    const result = await RateChartService.updateChart(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, "Chart updated", result));
});
/**
 * DELETE
 */
const deleteChart = asyncHandler(async (req, res) => {
    await RateChartService.deleteChart(req.params.id);
    res.status(200).json(new ApiResponse(200, "null", "Chart deleted"));
});
export const RateChartController = {
    createRateChart,
    getAllCharts,
    getActiveChart,
    getSingleChart,
    updateChart,
    deleteChart,
};
