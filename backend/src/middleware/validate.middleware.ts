import { Request, Response, NextFunction } from "express";

import { ZodObject, ZodError } from "zod";

import ApiError from "../utils/ApiError.js";

interface ValidationSchemas {
    body?: ZodObject<any>;
    params?: ZodObject<any>;
    query?: ZodObject<any>;
}

export const validate = (
    schemas: ValidationSchemas = {}
) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            /**
             * BODY VALIDATION
             */

            if (schemas.body) {
                const result =
                    await schemas.body.safeParseAsync(
                        req.body
                    );

                if (!result.success) {
                    throw formatZodError(
                        result.error
                    );
                }

                req.body = result.data;
            }

            /**
             * PARAMS VALIDATION
             */

            if (schemas.params) {
                const result =
                    await schemas.params.safeParseAsync(
                        req.params
                    );

                if (!result.success) {
                    throw formatZodError(
                        result.error
                    );
                }

                Object.assign(req.params, result.data);
            }

            /**
             * QUERY VALIDATION
             */

            if (schemas.query) {
                const result =
                    await schemas.query.safeParseAsync(
                        req.query
                    );

                if (!result.success) {
                    throw formatZodError(
                        result.error
                    );
                }

                Object.assign(req.query, result.data);
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};

/**
 * FORMAT ZOD ERRORS
 */

const formatZodError = (
    error: ZodError
): ApiError => {
    const formattedErrors = error.issues.map(
        (issue) => ({
            field: issue.path.join("."),

            message: issue.message,
        })
    );

    return new ApiError(
        400,

        "Validation failed",

        {
            code: "VALIDATION_ERROR",

            errors: formattedErrors,
        }
    );
};