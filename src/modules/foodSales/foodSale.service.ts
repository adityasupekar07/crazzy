import { prisma }
from "../../db/index.js";


import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * CREATE FOOD SALE
 * =====================================================
 */

export const createFoodSale =
    async (
        adminId: string,
        data: any
    ) => {

        /**
         * CHECK CUSTOMER
         */

        const customer =
            await prisma.customer.findFirst({
                where: {
                    id:
                        data.customerId,

                    adminId,
                },
            });

        if (!customer) {
            throw new ApiError(
                404,
                "Customer not found"
            );
        }

        /**
         * CHECK PURCHASE
         */

        const purchase =
            await prisma.foodPurchase.findFirst({
                where: {
                    id:
                        data.foodPurchaseId,

                    adminId,
                },
            });

        if (!purchase) {
            throw new ApiError(
                404,
                "Food purchase not found"
            );
        }

        /**
         * STOCK VALIDATION
         */

        if (
            purchase.remainingQuantity <
            data.quantity
        ) {
            throw new ApiError(
                400,
                "Insufficient stock available"
            );
        }

        /**
         * CALCULATIONS
         */

        const totalAmount =
            data.quantity *
            purchase.sellRate;

        const pendingAmount =
            totalAmount -
            data.amountPaid;

        if (
            data.amountPaid >
            totalAmount
        ) {
            throw new ApiError(
                400,
                "Amount paid cannot exceed total amount"
            );
        }

        /**
         * TRANSACTION
         */

        const result =
            await prisma.$transaction(
                async (tx) => {

                    /**
                     * CREATE SALE
                     */ 

                    const sale =
                        await tx.foodSale.create({
                            data: {
                                adminId,

                                customerId:
                                    data.customerId,

                                foodPurchaseId:
                                    data.foodPurchaseId,

                                foodName:
                                    purchase.foodName,

                                quantity:
                                    data.quantity,

                                sellRate:
                                    purchase.sellRate,

                                totalAmount,

                                amountPaid:
                                    data.amountPaid,

                                pendingAmount,

                                isCashPayment:
                                    data.isCashPayment,

                                saleDate:
                                    new Date(
                                        data.saleDate
                                    ),
                            },

                            include: {
                                customer: {
                                    select: {
                                        id: true,

                                        name: true,

                                        code:
                                            true,
                                    },
                                },

                                foodPurchase: {
                                    select: {
                                        id: true,

                                        foodName: true,
                                    },
                                },
                            },
                        });

                    /**
                     * UPDATE STOCK
                     */

                    await tx.foodPurchase.update({
                        where: {
                            id:
                                purchase.id,
                        },

                        data: {
                            remainingQuantity: {
                                decrement:
                                    data.quantity,
                            },
                        },
                    });

                    return sale;
                }
            );

        return result;
    };

/**
 * =====================================================
 * GET ALL FOOD SALES
 * =====================================================
 */

export const getAllFoodSales =
    async (adminId: string) => {

        return prisma.foodSale.findMany({
            where: {
                adminId,
            },

            include: {

                customer: {
                    select: {
                        code:
                            true,

                        name: true,
                    },
                },

                foodPurchase: {
                    select: {
                        foodName:
                            true,
                    },
                },
            },

            orderBy: {
                createdAt:
                    "desc",
            },
        });
    };

/**
 * =====================================================
 * GET PENDING FOOD SALES
 * =====================================================
 */

export const getPendingFoodSales =
    async (adminId: string) => {

        return prisma.foodSale.findMany({
            where: {
                adminId,

                pendingAmount: {
                    gt: 0,
                },
            },

            include: {

                customer: {
                    select: {
                        code:
                            true,

                        name: true,
                    },
                },

                foodPurchase: {
                    select: {
                        foodName:
                            true,
                    },
                },
            },

            orderBy: {
                createdAt:
                    "desc",
            },
        });
    };

/**
 * =====================================================
 * UPDATE FOOD SALE
 * =====================================================
 */

export const updateFoodSale =
    async (
        adminId: string,
        saleId: string,
        data: any
    ) => {

        /**
         * CHECK SALE
         */

        const sale =
            await prisma.foodSale.findFirst({
                where: {
                    id: saleId,

                    adminId,
                },
            });

        if (!sale) {
            throw new ApiError(
                404,
                "Food sale not found"
            );
        }

        /**
         * RECALCULATE PENDING
         */

        const updatedAmountPaid =
            data.amountPaid ??
            sale.amountPaid;

        if (
            updatedAmountPaid >
            sale.totalAmount
        ) {
            throw new ApiError(
                400,
                "Amount paid cannot exceed total amount"
            );
        }

        const updatedPending =
            sale.totalAmount -
            updatedAmountPaid;

        /**
         * UPDATE SALE
         */

        return prisma.foodSale.update({
            where: {
                id: saleId,
            },

            data: {
                amountPaid:
                    updatedAmountPaid,

                pendingAmount:
                    updatedPending,

                isCashPayment:
                    data.isCashPayment,

                saleDate:
                    data.saleDate
                        ? new Date(
                              data.saleDate
                          )
                        : undefined,
            },

            include: {

                customer: {
                    select: {
                        code:
                            true,

                        name: true,
                    },
                },

                foodPurchase: {
                    select: {
                        foodName:
                            true,
                    },
                },
            },
        });
    };