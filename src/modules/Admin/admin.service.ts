import bcrypt from "bcrypt";

import { prisma }
from "../../config/prisma.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * GET PROFILE
 * =====================================================
 */

export const getProfile =
    async (adminId: string) => {

        const admin =
            await prisma.admin.findUnique({
                where: {
                    id: adminId,
                },

                select: {
                    id: true,

                    ownerName:
                        true,

                    mobile:
                        true,

                    dairyName:
                        true,

                    village:
                        true,

                    taluka:
                        true,

                    district:
                        true,

                    state:
                        true,

                    collectionType:
                        true,

                    milkType:
                        true,

                    collectionShift:
                        true,

                    paymentPeriod:
                        true,

                    createdAt:
                        true,

                    updatedAt:
                        true,
                },
            });

        if (!admin) {
            throw new ApiError(
                404,
                "Admin not found"
            );
        }

        return admin;
    };

/**
 * =====================================================
 * UPDATE PROFILE
 * =====================================================
 */

export const updateProfile =
    async (
        adminId: string,
        data: any
    ) => {

        /**
         * CHECK MOBILE EXISTS
         */

        const existingAdmin =
            await prisma.admin.findFirst({
                where: {
                    mobile:
                        data.mobile,

                    NOT: {
                        id:
                            adminId,
                    },
                },
            });

        if (existingAdmin) {
            throw new ApiError(
                400,
                "Mobile already exists"
            );
        }

        /**
         * UPDATE PROFILE
         */

        return prisma.admin.update({
            where: {
                id: adminId,
            },

            data: {
                ownerName:
                    data.ownerName,

                mobile:
                    data.mobile,
            },

            select: {
                id: true,

                ownerName:
                    true,

                mobile:
                    true,

                dairyName:
                    true,

                createdAt:
                    true,
            },
        });
    };

/**
 * =====================================================
 * UPDATE DAIRY INFO
 * =====================================================
 */

export const updateDairyInfo =
    async (
        adminId: string,
        data: any
    ) => {

        return prisma.admin.update({
            where: {
                id: adminId,
            },

            data: {
                dairyName:
                    data.dairyName,

                village:
                    data.village,

                taluka:
                    data.taluka,

                district:
                    data.district,

                state:
                    data.state,
            },

            select: {
                dairyName:
                    true,

                village:
                    true,

                taluka:
                    true,

                district:
                    true,

                state:
                    true,
            },
        });
    };

/**
 * =====================================================
 * UPDATE SETTINGS
 * =====================================================
 */

export const updateSettings =
    async (
        adminId: string,
        data: any
    ) => {

        return prisma.admin.update({
            where: {
                id: adminId,
            },

            data: {
                collectionType:
                    data.collectionType,

                milkType:
                    data.milkType,

                collectionShift:
                    data.collectionShift,

                paymentPeriod:
                    data.paymentPeriod,
            },

            select: {
                collectionType:
                    true,

                milkType:
                    true,

                collectionShift:
                    true,

                paymentPeriod:
                    true,
            },
        });
    };

/**
 * =====================================================
 * CHANGE PASSWORD
 * =====================================================
 */

export const changePassword =
    async (
        adminId: string,
        data: any
    ) => {

        const admin =
            await prisma.admin.findUnique({
                where: {
                    id: adminId,
                },
            });

        if (!admin) {
            throw new ApiError(
                404,
                "Admin not found"
            );
        }

        /**
         * CHECK OLD PASSWORD
         */

        const isPasswordCorrect =
            await bcrypt.compare(
                data.oldPassword,

                admin.password
            );

        if (!isPasswordCorrect) {
            throw new ApiError(
                400,
                "Old password is incorrect"
            );
        }

        /**
         * HASH NEW PASSWORD
         */

        const hashedPassword =
            await bcrypt.hash(
                data.newPassword,
                10
            );

        /**
         * UPDATE PASSWORD
         */

        await prisma.admin.update({
            where: {
                id: adminId,
            },

            data: {
                password:
                    hashedPassword,
            },
        });

        return null;
    };

/**
 * =====================================================
 * DASHBOARD
 * =====================================================
 */

export const getDashboard =
    async (adminId: string) => {

        /**
         * TOTAL CUSTOMERS
         */

        const totalCustomers =
            await prisma.customer.count({
                where: {
                    adminId,
                },
            });

        /**
         * TODAY DATE
         */

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        /**
         * TODAY MILK COLLECTION
         */

        const todayEntries =
            await prisma.milkEntry.findMany({
                where: {
                    customer: {
                        adminId,
                    },

                    date: {
                        gte:
                            today,
                    },
                },

                select: {
                    quantity:
                        true,

                    totalAmount:
                        true,
                },
            });

        /**
         * CALCULATE TOTALS
         */

     const todayMilkCollection =
    todayEntries.reduce(
        (
            acc: number,

            item: {
                quantity: number;
            }
        ) =>
            acc + item.quantity,

        0
    );

       const todayAmount =
    todayEntries.reduce(
        (
            acc: number,

            item: {
                totalAmount:
                    number | null;
            }
        ) =>
            acc +
            (item.totalAmount || 0),

        0
    );

        return {
            totalCustomers,

            todayMilkCollection,

            todayAmount,
        };
    };