import { redis } from "../config/redis.js";
class CacheService {
    /**
     * GET
     */
    async get(key) {
        try {
            const data = await redis.get(key);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    /**
     * SET
     */
    async set(key, value, ttl = 3600) {
        try {
            await redis.set(key, JSON.stringify(value), {
                EX: ttl,
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    /**
     * DELETE
     */
    async del(key) {
        try {
            await redis.del(key);
        }
        catch (error) {
            console.log(error);
        }
    }
    /**
     * EXISTS
     */
    async exists(key) {
        const result = await redis.exists(key);
        return result === 1;
    }
    /**
     * CLEAR PATTERN
     */
    async clearPattern(pattern) {
        const keys = await redis.keys(pattern);
        if (keys.length) {
            await redis.del(keys);
        }
    }
}
export const cache = new CacheService();
