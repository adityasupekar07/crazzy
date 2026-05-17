import { prisma }
from "../../config/prisma.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * ADD MILK ENTRY
 * =====================================================
 */

export const addMilkEntry =
    async (data: any) => {

        /**
         * CHECK CUSTOMER EXISTS
         */

        const customer =
            await prisma.customer.findUnique({
                where: {
                    code: data.customerCode,
                },
            });

        if (!customer) {
            throw new ApiError(
                404,
                "Customer not found"
            );
        }
        
        /**
         * CREATE ENTRY
         */

        return prisma.milkEntry.create({
            data: {
                customerId:
                    data.customerId,

                date:
                    new Date(
                        data.date
                    ),

                shift:
                    data.shift,

                milkType:
                    data.milkType,

                quantity:
                    data.quantity,

                fat:
                    data.fat,

                snf:
                    data.snf,

                rate:
                    data.rate,

                totalAmount:
                    data.totalAmount,
            },
        });
    };

/**
 * =====================================================
 * GET CUSTOMER ENTRIES
 * =====================================================
 */

export const getCustomerMilkEntries =
    async (
        customerId: string,
        page: number,
        limit: number
    ) => {

        const skip =
            (page - 1) * limit;

        const entries =
            await prisma.milkEntry.findMany({
                where: {
                    customerId,
                },

                orderBy: {
                    date:
                        "desc",
                },

                skip,

                take: limit,
            });

        const total =
            await prisma.milkEntry.count({
                where: {
                    customerId,
                },
            });

        return {
            entries,

            pagination: {
                total,

                page,

                limit,

                totalPages:
                    Math.ceil(
                        total / limit
                    ),
            },
        };
    };

/**
 * =====================================================
 * GET SINGLE ENTRY
 * =====================================================
 */

export const getMilkEntryById =
    async (id: string) => {

        const entry =
            await prisma.milkEntry.findUnique({
                where: {
                    id,
                },
            });

        if (!entry) {
            throw new ApiError(
                404,
                "Milk entry not found"
            );
        }

        return entry;
    };

/**
 * =====================================================
 * UPDATE ENTRY
 * =====================================================
 */

export const updateMilkEntry =
    async (
        id: string,
        data: any
    ) => {

        const existingEntry =
            await prisma.milkEntry.findUnique({
                where: {
                    id,
                },
            });

        if (!existingEntry) {
            throw new ApiError(
                404,
                "Milk entry not found"
            );
        }

        return prisma.milkEntry.update({
            where: {
                id,
            },

            data,
        });
    };

/**
 * =====================================================
 * DELETE ENTRY
 * =====================================================
 */

export const deleteMilkEntry =
    async (id: string) => {

        const existingEntry =
            await prisma.milkEntry.findUnique({
                where: {
                    id,
                },
            });

        if (!existingEntry) {
            throw new ApiError(
                404,
                "Milk entry not found"
            );
        }

        await prisma.milkEntry.delete({
            where: {
                id,
            },
        });

        return null;
    };