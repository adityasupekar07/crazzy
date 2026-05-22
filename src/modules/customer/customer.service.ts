import { prisma }
from "../../db/index.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * ADD CUSTOMER
 * =====================================================
 */

export const addCustomer =
    async (data: any) => {

        /**
         * CHECK EXISTING CODE
         */

        const existingCustomer =
            await prisma.customer.findFirst({
                where: {
                    adminId:
                        data.adminId,

                    OR: [
                        {
                            code:
                                data.code,
                        },

                        {
                            mobile:
                                data.mobile,
                        },
                    ],
                },
            });

        if (existingCustomer) {
            throw new ApiError(
                400,
                "Customer already exists"
            );
        }

        /**
         * CREATE CUSTOMER
         */

        return prisma.customer.create({
            data,
        });
    };

/**
 * =====================================================
 * GET CUSTOMERS
 * =====================================================
 */

export const getCustomers =
    async (adminId: string) => {

        return prisma.customer.findMany({
            where: {
                adminId,
            },

            orderBy: {
                createdAt:
                    "desc",
            },
        });
    };