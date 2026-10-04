import admin from "firebase-admin";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import logger from "./logger.js";

/**
 * =====================================================
 * FIREBASE SERVICE ACCOUNT INITIALIZATION
 * =====================================================
 */

const filePath = resolve("firebase-service-account.json");
let isInitialized = false;

try {
    let serviceAccount: any = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (existsSync(filePath)) {
        serviceAccount = JSON.parse(readFileSync(filePath, "utf-8"));
    }

    if (serviceAccount && !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        isInitialized = true;
        logger.info("✅ Firebase Admin initialized successfully");
    } else if (!admin.apps.length) {
        logger.warn(
            "⚠️ Firebase service account file ('firebase-service-account.json') not found. Running in development/mock auth mode."
        );
    }
} catch (error) {
    logger.warn("⚠️ Failed to load Firebase credentials, running with fallback mock auth:", error);
}

// Fallback wrapper for dev mode if Firebase is not initialized
const firebaseAdminProxy = new Proxy(admin, {
    get(target, prop) {
        if (prop === "auth") {
            if (isInitialized && admin.apps.length) {
                return admin.auth.bind(admin);
            }
            return () => ({
                verifyIdToken: async (token: string) => {
                    logger.info("🧪 [Mock Auth] Verifying ID token in dev mode");
                    // If token contains phone number or is a test token
                    if (token.startsWith("mock_") || token.includes("+91") || process.env.NODE_ENV === "development") {
                        const phoneMatch = token.match(/\+91\d{10}/);
                        return {
                            phone_number: phoneMatch ? phoneMatch[0] : "+919876543210",
                            uid: "mock_firebase_user_id",
                        };
                    }
                    throw new Error("Firebase Admin not configured. Please add firebase-service-account.json");
                },
            });
        }
        return (target as any)[prop];
    },
});

export default firebaseAdminProxy as typeof admin;