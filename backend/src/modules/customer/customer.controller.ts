import asyncHandler
from "../../utils/asyncHandler.js";

import ApiResponse
from "../../utils/ApiResponse.js";

import * as customerService
from "./customer.service.js";

/**
 * =====================================================
 * ADD CUSTOMER
 * =====================================================
 */

export const addCustomer =
    asyncHandler(
        async (req, res) => {

            const result =
                await customerService.addCustomer({
                    ...req.body,

                    adminId:
                        req.user.id,
                });

            return res.status(201).json(
                new ApiResponse(
                    201,
                    "Customer added successfully",
                    result
                )
            );
        }
    );

/**
 * =====================================================
 * GET CUSTOMERS
 * =====================================================
 */

export const getCustomers =
    asyncHandler(
        async (req, res) => {

            const result =
                await customerService.getCustomers(
                    req.user.id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Customers fetched successfully",
                    result
                )
            );
        }
    );

export const getCustomerById = asyncHandler(async (req, res) => {
  const customerId = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const result = await customerService.getCustomerById(customerId, req.user.id);
  return res.status(200).json(new ApiResponse(200, "Customer fetched successfully", result));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customerId = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const result = await customerService.updateCustomer(
    customerId,
    req.body,
    req.user.id
  );
  return res.status(200).json(
    new ApiResponse(200, "Customer updated successfully", result)
  );
});

export const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const customerId = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const result = await customerService.toggleCustomerStatus(
    customerId,
    req.user.id
  );
  return res.status(200).json(
    new ApiResponse(200, "Customer status toggled successfully", result)
  );
});

    export const debugCustomerApi =
  asyncHandler(async (req, res) => {

    console.log('\n========================');
    console.log('[DEBUG CONTROLLER HIT]');
    console.log('========================');

    console.log('REQ.USER:', req.user);

    const result =
      await customerService.debugService();

    console.log(
      '[DEBUG CONTROLLER SUCCESS]'
    );

    return res.status(200).json({
      success: true,
      message: 'Debug API Working',
      data: result,
    });
  });
  