import { prisma }
from "../../config/prisma.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * CREATE FOOD PURCHASE
 * =====================================================
 */

export const createFoodPurchase =
    async (
        adminId: string,
        data: any
    ) => {

        /**
         * CHECK DEALER EXISTS
         */

        const dealer =
            await prisma.foodDealer.findFirst({
                where: {
                    id:
                        data.dealerId,

                    adminId,
                },
            });

        if (!dealer) {
            throw new ApiError(
                404,
                "Dealer not found"
            );
        }

        /**
         * CALCULATIONS
         */

        const totalAmount =
            data.quantity *
            data.buyRate;

        const pendingAmount =
            totalAmount -
            data.amountPaid;

        /**
         * VALIDATION
         */

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
         * CREATE PURCHASE
         */

        return prisma.foodPurchase.create({
            data: {
                adminId,

                dealerId:
                    data.dealerId,

                foodName:
                    data.foodName,

                quantity:
                    data.quantity,

                remainingQuantity:
                    data.quantity,

                buyRate:
                    data.buyRate,

                sellRate:
                    data.sellRate,

                totalAmount,

                amountPaid:
                    data.amountPaid,

                pendingAmount,

                purchaseDate:
                    new Date(
                        data.purchaseDate
                    ),
            },

            include: {
                dealer: {
                    select: {
                        id: true,

                        code: true,

                        name: true,
                    },
                },
            },
        });
    };

/**
 * =====================================================
 * GET ALL FOOD PURCHASES
 * =====================================================
 */

export const getAllFoodPurchases =
    async (adminId: string) => {

        return prisma.foodPurchase.findMany({
            where: {
                adminId,
            },

            include: {
                dealer: {
                    select: {
                        code: true,

                        name: true,
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
 * GET AVAILABLE STOCK
 * =====================================================
 */

export const getAvailableStock =
    async (adminId: string) => {

        return prisma.foodPurchase.findMany({
            where: {
                adminId,

                remainingQuantity: {
                    gt: 0,
                },
            },

            include: {
                dealer: {
                    select: {
                        code: true,

                        name: true,
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
 * GET OUT OF STOCK
 * =====================================================
 */

export const getOutOfStockItems =
    async (adminId: string) => {

        return prisma.foodPurchase.findMany({
            where: {
                adminId,

                remainingQuantity: {
                    lte: 0,
                },
            },

            include: {
                dealer: {
                    select: {
                        code: true,

                        name: true,
                    },
                },
            },

            orderBy: {
                createdAt:
                    "desc",
            },
        });
    };