import { z }
from "zod";

/**
 * =====================================================
 * UPDATE PROFILE
 * =====================================================
 */

export const updateProfileSchema =
    z.object({
        ownerName:
            z.string()
            .min(2),

        mobile:
            z.string()
            .min(10),
    });

/**
 * =====================================================
 * UPDATE DAIRY INFO
 * =====================================================
 */

export const updateDairyInfoSchema =
    z.object({
        dairyName:
            z.string(),

        village:
            z.string(),

        taluka:
            z.string(),

        district:
            z.string(),

        state:
            z.string(),
    });

/**
 * =====================================================
 * UPDATE SETTINGS
 * =====================================================
 */

export const updateSettingsSchema =
    z.object({
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
 * CHANGE PASSWORD
 * =====================================================
 */

export const changePasswordSchema =
    z.object({
        oldPassword:
            z.string(),

        newPassword:
            z.string()
            .min(8),
    });