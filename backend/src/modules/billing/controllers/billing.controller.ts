import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { BillingCycleService } from '../services/billing-cycle.service.js';
import { BillingPreviewService } from '../services/billing-preview.service.js';
import { SettlementService } from '../services/settlement.service.js';
import { FarmerSelectorService } from '../services/farmer-selector.service.js';
import { FarmerHistoryService } from '../services/farmer-history.service.js';
import {
  billingFarmersQuerySchema,
  billingPreviewRequestSchema,
  farmerHistoryParamsSchema,
  farmerHistoryQuerySchema,
} from '../validators/billing.schema.js';

export const getBillingFarmers = asyncHandler(async (req, res) => {
  const validated = billingFarmersQuerySchema.parse(req.query);
  const result = await FarmerSelectorService.listFarmersForBilling(req.user.id, validated);
  return res.status(200).json(
    new ApiResponse(200, 'Billing farmers fetched successfully', result)
  );
});

export const getFarmerHistory = asyncHandler(async (req, res) => {
  const { farmerId } = farmerHistoryParamsSchema.parse(req.params);
  const { startDate, endDate } = farmerHistoryQuerySchema.parse(req.query);
  const result = await FarmerHistoryService.getFarmerBillingHistory(
    req.user.id,
    farmerId,
    startDate,
    endDate
  );
  return res.status(200).json(
    new ApiResponse(200, 'Farmer history fetched successfully', result)
  );
});

export const getSupportedCycles = asyncHandler(async (req, res) => {
  const result = BillingCycleService.getSupportedCycles(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, 'Supported billing cycles fetched successfully', result)
  );
});

export const getCurrentBillingCycle = asyncHandler(async (req, res) => {
  const result = await BillingCycleService.resolveCurrentCycleForDairy(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, 'Current billing cycle resolved', result)
  );
});

export const previewSettlement = asyncHandler(async (req, res) => {
  const validated = billingPreviewRequestSchema.parse(req.body);
  const result = await BillingPreviewService.generateBillingPreview(req.user.id, validated);
  return res.status(200).json(
    new ApiResponse(200, 'Billing preview generated successfully', result)
  );
});

export const createSettlement = asyncHandler(async (req, res) => {
  const result = await SettlementService.createSettlement(req.user.id, req.body);
  return res.status(201).json(
    new ApiResponse(201, 'Bill settlement created successfully', result)
  );
});

export const getBillingHistory = asyncHandler(async (req, res) => {
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
  const result = await SettlementService.getBillingHistory(req.user.id, customerId);
  return res.status(200).json(
    new ApiResponse(200, 'Billing history fetched successfully', result)
  );
});

