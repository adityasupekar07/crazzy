import { z } from "zod";

/**
 * =====================================================
 * VERIFY PHONE
 * =====================================================
 */

export const verifyPhoneSchema =
    z.object({
        firebaseToken:
            z.string()
            .min(
                1,
                "Firebase token is required"
            ),

        ownerName:
            z.string()
            .min(
                2,
                "Owner name must be at least 2 characters"
            ),
    });

/**
 * =====================================================
 * REGISTER
 * =====================================================
 */

export const registerSchema =
    z.object({
        tempToken:
            z.string()
            .min(
                1,
                "Temp token is required"
            ),

        password:
            z.string()
            .min(
                8,
                "Password must be at least 8 characters"
            ),

        dairyName:
            z.string()
            .min(
                1,
                "Dairy name is required"
            ),

        village:
            z.string()
            .min(
                1,
                "Village is required"
            ),

        taluka:
            z.string()
            .min(
                1,
                "Taluka is required"
            ),

        district:
            z.string()
            .min(
                1,
                "District is required"
            ),

        state:
            z.string()
            .min(
                1,
                "State is required"
            ),

        collectionType:
            z.enum([
                "FIXED_RATE",
                "FAT_BASED",
                "FAT_SNF_BASED",
            ]),

        milkType:
            z.enum([
                "COW",
                "BUFFALO",
                "MIX",
            ]),

        collectionShift:
            z.enum([
                "MORNING",
                "EVENING",
                "BOTH",
            ]),

        paymentPeriod:
            z.enum([
                "DAILY",
                "WEEKLY",
                "BIWEEKLY",
                "MONTHLY",
            ]),
    });

/**
 * =====================================================
 * LOGIN
 * =====================================================
 */

export const loginSchema =
    z.object({
        mobile:
            z.string()
            .min(
                10,
                "Invalid mobile number"
            ),

        password:
            z.string()
            .min(
                1,
                "Password is required"
            ),
    });