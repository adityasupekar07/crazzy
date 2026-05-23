import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as customerService from "./customer.service.js";
/**
 * =====================================================
 * ADD CUSTOMER
 * =====================================================
 */
export const addCustomer = asyncHandler(async (req, res) => {
    const result = await customerService.addCustomer({
        ...req.body,
        adminId: req.user.id,
    });
    return res.status(201).json(new ApiResponse(201, "Customer added successfully", result));
});
/**
 * =====================================================
 * GET CUSTOMERS
 * =====================================================
 */
export const getCustomers = asyncHandler(async (req, res) => {
    const result = await customerService.getCustomers(req.user.id);
    return res.status(200).json(new ApiResponse(200, "Customers fetched successfully", result));
});
