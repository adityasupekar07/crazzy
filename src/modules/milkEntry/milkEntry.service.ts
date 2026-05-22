import { number } from "zod";
import { prisma }
from "../../db/index.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * ADD MILK ENTRY
 * =====================================================
 */



export const addMilkEntry =
    async (
        adminId: string,

        data: any
    ) => {

        /**
         * FIND CUSTOMER
         * USING:
         * adminId + customerCode
         */

        const customer =
            await prisma.customer.findFirst({
                where: {
                    adminId,

                    code:
                    Number   ( data.customerCode),
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
                    customer.id,

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
     /**
 * =====================================================
 * GET TODAY ENTRIES
 * =====================================================
 */

export const getTodayMilkEntries =
    async (
        adminId: string,
       
    ) => {

        const startOfDay =
            new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        const endOfDay =
            new Date();

        endOfDay.setHours(
            23,
            59,
            59,
            999
        );

        const entries =
            await prisma.milkEntry.findMany({

                where: {

                    customer: {
                        adminId,
                    },

                   

                    date: {
                        gte:
                            startOfDay,

                        lte:
                            endOfDay,
                    },
                },

                include: {
                    customer: true,
                },

                orderBy: {
                    createdAt:
                        "desc",
                },
            });
            console.log(entries);

        return entries;
    };