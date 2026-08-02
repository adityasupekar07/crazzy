import { redis } from "../config/redis.js";
import logger from "../config/logger.js";

class CacheService {
  /**
   * GET
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redis.isOpen) {
        return null;
      }
      const data = await redis.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      logger.warn(`[CacheService] get failed for key "${key}":`, { error });
      return null;
    }
  }

  /**
   * SET
   */
  async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    try {
      if (!redis.isOpen) {
        return;
      }
      await redis.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      logger.warn(`[CacheService] set failed for key "${key}":`, { error });
    }
  }

  /**
   * DELETE
   */
  async del(key: string): Promise<void> {
    try {
      if (!redis.isOpen) {
        return;
      }
      await redis.del(key);
    } catch (error) {
      logger.warn(`[CacheService] del failed for key "${key}":`, { error });
    }
  }

  /**
   * EXISTS
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!redis.isOpen) {
        return false;
      }
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.warn(`[CacheService] exists failed for key "${key}":`, { error });
      return false;
    }
  }

  /**
   * CLEAR PATTERN
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (!redis.isOpen) {
        return;
      }
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.warn(`[CacheService] clearPattern failed for pattern "${pattern}":`, { error });
    }
  }
}

export const cache = new CacheService();