import { createClient, } from "redis";
import logger from "./logger.js";
const globalForRedis = globalThis;
export const redis = globalForRedis.redis ??
    createClient({
        url: process.env.REDIS_URL ??
            "redis://127.0.0.1:6379",
    });
let connected = false;
/**
 * STATUS
 */
export const isRedisConnected = () => connected;
/**
 * EVENTS
 */
redis.on("connect", () => {
    logger.info("Redis connecting...");
});
redis.on("ready", () => {
    connected = true;
    logger.info("✅ Redis ready");
});
redis.on("end", () => {
    connected = false;
    logger.warn("Redis disconnected");
});
redis.on("error", (error) => {
    connected = false;
    logger.error("Redis client error", { error });
});
/**
 * CONNECT
 */
export const connectRedis = async () => {
    try {
        if (!redis.isOpen) {
            await redis.connect();
        }
    }
    catch (error) {
        connected = false;
        logger.warn("Redis unavailable", { error });
    }
};
/**
 * DISCONNECT
 */
export const disconnectRedis = async () => {
    try {
        if (redis.isOpen) {
            await redis.quit();
        }
        connected = false;
        logger.info("Redis disconnected");
    }
    catch (error) {
        logger.error("Redis disconnect error", { error });
    }
};
/**
 * DEV HOT RELOAD
 */
if (process.env.NODE_ENV !==
    "production") {
    globalForRedis.redis = redis;
}
