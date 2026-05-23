import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
/**
 * =========================================================
 * CREATE LOG DIRECTORY
 * =========================================================
 */
const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
/**
 * =========================================================
 * WINSTON FORMATS
 * =========================================================
 */
const { combine, timestamp, printf, colorize, errors, json, } = winston.format;
/**
 * =========================================================
 * SENSITIVE DATA SANITIZATION
 * =========================================================
 */
const SENSITIVE_KEYS = [
    "password",
    "token",
    "authorization",
    "cookie",
    "refreshToken",
    "accessToken",
    "secret",
    "apiKey",
];
const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }
    const clone = Array.isArray(obj)
        ? [...obj]
        : { ...obj };
    Object.keys(clone).forEach((key) => {
        const lowerKey = key.toLowerCase();
        /**
         * Redact sensitive fields
         */
        if (SENSITIVE_KEYS.includes(lowerKey)) {
            clone[key] = "[REDACTED]";
        }
        /**
         * Recursive sanitize
         */
        else if (typeof clone[key] === "object" &&
            clone[key] !== null) {
            clone[key] = sanitize(clone[key]);
        }
        /**
         * Prevent huge logs
         */
        else if (typeof clone[key] === "string" &&
            clone[key].length > 5000) {
            clone[key] = "[TOO_LARGE]";
        }
    });
    return clone;
};
const sanitizeFormat = winston.format((info) => {
    return sanitize(info);
});
/**
 * =========================================================
 * DEVELOPMENT FORMAT
 * =========================================================
 */
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const base = `${timestamp} [${level}]: ${stack || message}`;
    const metaString = Object.keys(meta).length > 0
        ? `\n${JSON.stringify(meta, null, 2)}`
        : "";
    return base + metaString;
});
/**
 * =========================================================
 * LOGGER INSTANCE
 * =========================================================
 */
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production"
        ? "info"
        : "debug",
    defaultMeta: {
        service: "dairy-backend",
        environment: process.env.NODE_ENV || "development",
    },
    format: combine(timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }), errors({
        stack: true,
    }), sanitizeFormat(), json()),
    transports: [
        /**
         * =================================================
         * CONSOLE TRANSPORT
         * =================================================
         */
        new winston.transports.Console({
            format: process.env.NODE_ENV === "production"
                ? combine(json())
                : combine(colorize(), devFormat),
        }),
        /**
         * =================================================
         * ERROR LOGS
         * =================================================
         */
        new DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            level: "error",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: json(),
        }),
        /**
         * =================================================
         * COMBINED LOGS
         * =================================================
         */
        new DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: json(),
        }),
    ],
    /**
     * =====================================================
     * UNCAUGHT EXCEPTIONS
     * =====================================================
     */
    exceptionHandlers: [
        new DailyRotateFile({
            filename: "logs/exceptions-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: json(),
        }),
    ],
    /**
     * =====================================================
     * UNHANDLED PROMISE REJECTIONS
     * =====================================================
     */
    rejectionHandlers: [
        new DailyRotateFile({
            filename: "logs/rejections-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: json(),
        }),
    ],
    exitOnError: false,
});
/**
 * =========================================================
 * MORGAN STREAM SUPPORT
 * =========================================================
 */
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
export default logger;
