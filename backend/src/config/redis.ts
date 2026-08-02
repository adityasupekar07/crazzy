import {
  createClient,
  type RedisClientType,
} from "redis";

import logger from "./logger.js";

const globalForRedis =
  globalThis as unknown as {
    redis:
      | RedisClientType
      | undefined;
  };

export const redis: RedisClientType =
  globalForRedis.redis ??
  createClient({
    url:
      process.env.REDIS_URL ??
      "redis://127.0.0.1:6379",
    socket: {
      reconnectStrategy(retries) {
        if (retries > 1) {
          return false; // Stop retrying if Redis is offline
        }
        return 500;
      },
    },
    
  });

let connected = false;

/**
 * STATUS
 */

export const isRedisConnected =
  (): boolean => connected;

/**
 * EVENTS
 */

redis.on(
  "connect",
  () => {
    logger.info(
      "Redis connecting..."
    );
  }
);

redis.on(
  "ready",
  () => {
    connected = true;

    logger.info(
      "✅ Redis ready"
    );
  }
);

redis.on(
  "end",
  () => {
    connected = false;

    logger.warn(
      "Redis disconnected"
    );
  }
);

redis.on(
  "error",
  (error) => {
    if (connected) {
      connected = false;
      logger.warn("Redis connection lost:", { error: error.message || error });
    }
  }
);

/**
 * CONNECT
 */

export const connectRedis =
  async (): Promise<void> => {

    try {

      if (!redis.isOpen) {
        await redis.connect();
      }

    } catch (error) {

      connected = false;

      logger.warn(
        "Redis unavailable",
        { error }
      );
    }
  };

/**
 * DISCONNECT
 */

export const disconnectRedis =
  async (): Promise<void> => {

    try {

      if (redis.isOpen) {
        await redis.quit();
      }

      connected = false;

      logger.info(
        "Redis disconnected"
      );

    } catch (error) {

      logger.error(
        "Redis disconnect error",
        { error }
      );
    }
  };

/**
 * DEV HOT RELOAD
 */

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForRedis.redis = redis;
}