import { Request, Response, NextFunction } from "express";

import  ApiError  from "../utils/ApiError.js";
import logger from "../config/logger.js";

const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
  
    let error = err;

    /**
     * =====================================================
     * NORMALIZE UNKNOWN ERRORS
     * =====================================================
     */

    /**
     * =====================================================
     * PRISMA UNIQUE CONSTRAINT ERROR (P2002)
     * =====================================================
     */
    if (err.code === "P2002") {
        const target = Array.isArray(err.meta?.target) 
            ? err.meta.target.join(", ") 
            : String(err.meta?.target || "");

        let friendlyMsg = "Duplicate entry: a record with these unique details already exists.";

        if (target.includes("code") && target.includes("adminId")) {
            friendlyMsg = "Customer code already exists. Please enter a different code.";
        } else if (target.includes("mobile")) {
            friendlyMsg = "A record with this mobile number already exists.";
        } else if (target.includes("shift") || target.includes("date")) {
            friendlyMsg = "A milk delivery entry for this shift already exists on this date.";
        }

        error = new ApiError(
            409,
            friendlyMsg,
            {
                code: "DUPLICATE_ENTRY",
                errors: err.meta?.target || [],
            }
        );
    } else if (!(error instanceof ApiError)) {
        error = new ApiError(
            err.statusCode || 500,

            err.message || "Internal Server Error",

            {
                code: "INTERNAL_SERVER_ERROR",

                errors: [],
            }
        );
    }

    /**
     * =====================================================
     * MONGOOSE VALIDATION ERROR
     * =====================================================
     */

    if (err.name === "ValidationError") {
        error = new ApiError(
            400,

            "Validation Error",

            {
                code: "VALIDATION_ERROR",

                errors: Object.values(err.errors).map(
                    (e: any) => e.message
                ),
            }
        );
    }

    /**
     * =====================================================
     * INVALID OBJECT ID
     * =====================================================
     */

    if (err.name === "CastError") {
        error = new ApiError(
            400,

            "Invalid ID format",

            {
                code: "INVALID_ID",

                errors: [],
            }
        );
    }

    /**
     * =====================================================
     * DUPLICATE FIELD ERROR
     * =====================================================
     */

    if (err.code === 11000) {
        error = new ApiError(
            400,

            "Duplicate field value",

            {
                code: "DUPLICATE_FIELD",

                errors: [],
            }
        );
    }

    /**
     * =====================================================
     * STRUCTURED ERROR LOGGING
     * =====================================================
     */

    logger.error({
        message: error.message,

        code: error.code,

        statusCode: error.statusCode,

        method: req.method,

        url: req.originalUrl,

        ip: req.ip,

        userAgent: req.headers["user-agent"],

        stack: error.stack,
    });

    /**
     * =====================================================
     * FINAL ERROR RESPONSE
     * =====================================================
     */

    return res.status(error.statusCode || 500).json({
        success: false,

        code: error.code || "INTERNAL_SERVER_ERROR",

        message:
            process.env.NODE_ENV === "production"
                ? error.message
                : error.message,

        errors: error.errors || [],

        ...(process.env.NODE_ENV ===
            "development" && {
            stack: error.stack,
        }),
    });
};
export default globalErrorHandler;