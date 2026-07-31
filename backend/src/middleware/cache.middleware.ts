import {
  Request,
  Response,
  NextFunction,
} from "express";

import { cache } from "../services/cache.service.js";

interface CacheOptions {

  key: (
    req: Request
  ) => string;

  ttl?: number;
}

export const cacheMiddleware =
  (
    options: CacheOptions
  ) => {

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {

      try {

        const cacheKey =
          options.key(req);

        const cached =
          await cache.get(cacheKey);

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

        const originalJson =
          res.json.bind(res);

        res.json = (
          body: any
        ) => {

          /**
           * STORE CACHE
           */

          cache.set(
            cacheKey,
            body,
            options.ttl
          );

          return originalJson(body);
        };

        next();

      } catch (error) {

        next();
      }
    };
  };