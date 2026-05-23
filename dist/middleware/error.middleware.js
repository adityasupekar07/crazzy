import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
const globalErrorHandler = (err, req, res, next) => {
    let error = err;
    /**
     * =====================================================
     * NORMALIZE UNKNOWN ERRORS
     * =====================================================
     */
    if (!(error instanceof ApiError)) {
        error = new ApiError(err.statusCode || 500, err.message || "Internal Server Error", {
            code: "INTERNAL_SERVER_ERROR",
            errors: [],
        });
    }
    /**
     * =====================================================
     * MONGOOSE VALIDATION ERROR
     * =====================================================
     */
    if (err.name === "ValidationError") {
        error = new ApiError(400, "Validation Error", {
            code: "VALIDATION_ERROR",
            errors: Object.values(err.errors).map((e) => e.message),
        });
    }
    /**
     * =====================================================
     * INVALID OBJECT ID
     * =====================================================
     */
    if (err.name === "CastError") {
        error = new ApiError(400, "Invalid ID format", {
            code: "INVALID_ID",
            errors: [],
        });
    }
    /**
     * =====================================================
     * DUPLICATE FIELD ERROR
     * =====================================================
     */
    if (err.code === 11000) {
        error = new ApiError(400, "Duplicate field value", {
            code: "DUPLICATE_FIELD",
            errors: [],
        });
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
        message: process.env.NODE_ENV === "production"
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
