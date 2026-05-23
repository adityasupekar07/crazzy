import admin from "firebase-admin";
import { readFileSync, } from "fs";
import { resolve, } from "path";
/**
 * =====================================================
 * FIREBASE SERVICE ACCOUNT
 * =====================================================
 */
const serviceAccount = JSON.parse(readFileSync(resolve("firebase-service-account.json"), "utf-8"));
/**
 * =====================================================
 * INITIALIZE FIREBASE ADMIN
 * =====================================================
 */
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
export default admin;
