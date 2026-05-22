import { prisma }
from "../../config/prisma.js";


import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * CREATE DEALER
 * =====================================================
 */

export const createFoodDealer =
    async (
        adminId: string,
        data: any
    ) => {

        /**
         * CHECK DEALER CODE EXISTS
         */

        const existingDealer =
            await prisma.foodDealer.findFirst({
                where: {
                    adminId,

                    code:
                        data.code,
                },
            });

        if (existingDealer) {
            throw new ApiError(
                400,
                "Dealer code already exists"
            );
        }

        /**
         * CREATE DEALER
         */

        return prisma.foodDealer.create({
            data: {
                adminId,

                code:
                    data.code,

                name:
                    data.name,

                phone:
                    data.phone,

                address:
                    data.address,

                isActive:
                    data.isActive ?? true,
            },

            select: {
                id: true,

                code: true,

                name: true,

                phone: true,

                address: true,

                isActive: true,

                createdAt: true,
            },
        });
    };

/**
 * =====================================================
 * UPDATE DEALER
 * =====================================================
 */

export const updateFoodDealer =
    async (
        adminId: string,
        dealerId: string,
        data: any
    ) => {

        /**
         * CHECK DEALER EXISTS
         */

        const dealer =
            await prisma.foodDealer.findFirst({
                where: {
                    id: dealerId,

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
         * CHECK DUPLICATE CODE
         */

        if (data.code) {

            const duplicateCode =
                await prisma.foodDealer.findFirst({
                    where: {
                        adminId,

                        code:
                            data.code,

                        NOT: {
                            id:
                                dealerId,
                        },
                    },
                });

            if (duplicateCode) {
                throw new ApiError(
                    400,
                    "Dealer code already exists"
                );
            }
        }

        /**
         * UPDATE DEALER
         */

        return prisma.foodDealer.update({
            where: {
                id: dealerId,
            },

            data: {
                code:
                    data.code,

                name:
                    data.name,

                phone:
                    data.phone,

                address:
                    data.address,

                isActive:
                    data.isActive,
            },

            select: {
                id: true,

                code: true,

                name: true,

                phone: true,

                address: true,

                isActive: true,

                updatedAt: true,
            },
        });
    };

/**
 * =====================================================
 * GET ALL DEALERS
 * =====================================================
 */

export const getAllFoodDealers =
    async (adminId: string) => {

        return prisma.foodDealer.findMany({
            where: {
                adminId,
            },

            orderBy: {
                createdAt:
                    "desc",
            },

            select: {
                id: true,

                code: true,

                name: true,

                phone: true,

                address: true,

                isActive: true,

                createdAt: true,

                updatedAt: true,
            },
        });
    };