import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as billingService from './billing.service.js';

export const createSettlement = asyncHandler(async (req, res) => {
  const result = await billingService.createSettlement(req.user.id, req.body);
  return res.status(201).json(
    new ApiResponse(201, 'Bill settlement created successfully', result)
  );
});

export const getBillingHistory = asyncHandler(async (req, res) => {
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
  const result = await billingService.getBillingHistory(req.user.id, customerId);
  return res.status(200).json(
    new ApiResponse(200, 'Billing history fetched successfully', result)
  );
});
