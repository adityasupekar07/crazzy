import { cache } from "../services/cache.service.js";
export const cacheMiddleware = (options) => {
    return async (req, res, next) => {
        try {
            const cacheKey = options.key(req);
            const cached = await cache.get(cacheKey);
            /**
             * CACHE HIT
             */
            if (cached) {
                return res.status(200).json({
                    success: true,
                    source: "redis-cache",
                    data: cached,
                });
            }
            /**
             * OVERRIDE JSON
             */
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                /**
                 * STORE CACHE
                 */
                cache.set(cacheKey, body, options.ttl);
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            next();
        }
    };
};
