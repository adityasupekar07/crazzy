import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import admin from "../../config/firebase.js";

import { prisma }
from "../../config/prisma.js";

import ApiError
from "../../utils/ApiError.js";

/**
 * =====================================================
 * VERIFY PHONE
 * =====================================================
 */

export const verifyPhone =
    async (data: any) => {

        const {
            firebaseToken,
            ownerName,
        } = data;

        /**
         * VERIFY FIREBASE TOKEN
         */

        // const decodedToken =
        //     await admin
        //         .auth()
        //         .verifyIdToken(
        //             firebaseToken
        //         );

        // /**
        //  * EXTRACT MOBILE
        //  */

        // const mobile =
        //     decodedToken.phone_number;
const mobile =
    "+919999999999";
    
        if (!mobile) {
            throw new ApiError(
                400,
                "Invalid phone number",
                {
                    code:
                        "INVALID_PHONE",
                }
            );
        }

        /**
         * CHECK EXISTING ADMIN
         */

        const existingAdmin =
            await prisma.admin.findUnique({
                where: {
                    mobile,
                },
            });

        if (existingAdmin) {
            throw new ApiError(
                400,
                "Admin already exists",
                {
                    code:
                        "ADMIN_EXISTS",
                }
            );
        }

        /**
         * GENERATE TEMP TOKEN
         */

        const tempToken =
            jwt.sign(
                {
                    mobile,

                    ownerName,
                },

                process.env
                    .JWT_SECRET!,

                {
                    expiresIn:
                        "15m",
                }
            );

        return {
            tempToken,

            mobile,

            ownerName,
        };
    };

/**
 * =====================================================
 * REGISTER
 * =====================================================
 */

export const register =
    async (data: any) => {

        const {
            tempToken,
           

            password,

            dairyName,

            village,

            taluka,

            district,

            state,

            collectionType,

            milkType,

            collectionShift,

            paymentPeriod,
        } = data;

        /**
         * VERIFY TEMP TOKEN
         */

        let decoded: any;

        try {
            decoded =
                jwt.verify(
                    tempToken,

                    process.env
                        .JWT_SECRET!
                );
        } catch {
            throw new ApiError(
                401,
                "Invalid or expired token",
                {
                    code:
                        "INVALID_TOKEN",
                }
            );
        }

        /**
         * HASH PASSWORD
         */

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        /**
         * CREATE ADMIN
         */

        const adminUser =
            await prisma.admin.create({
                data: {
                    ownerName:
                        decoded.ownerName,

                    mobile:
                        decoded.mobile,

                    password:
                        hashedPassword,

                    dairyName,

                    village,

                    taluka,

                    district,

                    state,

                    collectionType,

                    milkType,

                    collectionShift,

                    paymentPeriod,
                },
            });

        /**
         * GENERATE ACCESS TOKEN
         */

        const accessToken =
            jwt.sign(
                {
                    id:
                        adminUser.id,
                },

                process.env
                    .JWT_SECRET!,

                {
                    expiresIn:
                        "7d",
                }
            );

        /**
         * REMOVE PASSWORD
         */

        const {
            password:
                removedPassword,

            ...safeAdmin
        } = adminUser;

        return {
            accessToken,

            admin:
                safeAdmin,
        };
    };

/**
 * =====================================================
 * LOGIN
 * =====================================================
 */

export const login =
    async (data: any) => {

        const {
            mobile,
            password,
        } = data;

        /**
         * FIND ADMIN
         */

        const adminUser =
            await prisma.admin.findUnique({
                where: {
                    mobile,
                },
            });

        if (!adminUser) {
            throw new ApiError(
                404,
                "Admin not found",
                {
                    code:
                        "ADMIN_NOT_FOUND",
                }
            );
        }

        /**
         * CHECK PASSWORD
         */

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                adminUser.password
            );

        if (!isPasswordCorrect) {
            throw new ApiError(
                401,
                "Invalid credentials",
                {
                    code:
                        "INVALID_CREDENTIALS",
                }
            );
        }

        /**
         * GENERATE JWT
         */

        const accessToken =
            jwt.sign(
                {
                    id:
                        adminUser.id,
                },

                process.env
                    .JWT_SECRET!,

                {
                    expiresIn:
                        "7d",
                }
            );

        /**
         * REMOVE PASSWORD
         */

        const {
            password:
                removedPassword,

            ...safeAdmin
        } = adminUser;

        return {
            accessToken,

            admin:
                safeAdmin,
        };
    };