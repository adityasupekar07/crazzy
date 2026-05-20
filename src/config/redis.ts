import {
    createClient,
    type RedisClientType,
} from "redis";

import logger from "./logger.js";

const globalForRedis =
    globalThis as unknown as {
        redis: RedisClientType | undefined;
    };

export const redis: RedisClientType =
    globalForRedis.redis ??
    createClient({
        url:
            process.env.REDIS_URL ??
            "redis://127.0.0.1:6379",
    });

let connected = false;

export const isRedisConnected = (): boolean =>
    connected;

redis.on(
    "error",
    (error) => {
        logger.error(
            "Redis client error",
            { error }
        );
    }
);

export const connectRedis =
    async (): Promise<void> => {
        if (connected) {
            return;
        }

        try {
            if (!redis.isOpen) {
                await redis.connect();
            }

            connected = true;

            logger.info(
                "✅ Redis connected"
            );
        } catch (error) {
            connected = false;

            logger.warn(
                "Redis unavailable",
                { error }
            );

            throw error;
        }
    };

export const disconnectRedis =
    async (): Promise<void> => {
        if (!redis.isOpen) {
            connected = false;
            return;
        }

        await redis.quit();
        connected = false;

        logger.info(
            "Redis disconnected"
        );
    };

if (
    process.env.NODE_ENV !==
    "production"
) {
    globalForRedis.redis = redis;
}
