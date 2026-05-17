import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import logger from "./config/logger.js";

import { prisma } from "./config/prisma.js";

const PORT =
    process.env.PORT || 5000;

/**
 * =====================================================
 * START SERVER
 * =====================================================
 */

const startServer = async () => {
    try {
        /**
         * TEST DATABASE CONNECTION
         */

        await prisma.$connect();

        logger.info(
            "✅ PostgreSQL connected"
        );

        const server = app.listen(
            PORT,
            () => {
                logger.info(
                    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
                );
            }
        );

        /**
         * =================================================
         * GRACEFUL SHUTDOWN
         * =================================================
         */

        const shutdown = async (
            signal: string
        ) => {
            logger.warn(
                `🛑 ${signal} received`
            );

            server.close(async () => {
                await prisma.$disconnect();

                logger.info(
                    "✅ Server closed"
                );

                process.exit(0);
            });
        };

        process.on(
            "SIGINT",
            shutdown
        );

        process.on(
            "SIGTERM",
            shutdown
        );

        /**
         * =================================================
         * UNHANDLED ERRORS
         * =================================================
         */

        process.on(
            "unhandledRejection",
            (error) => {
                logger.error(
                    "Unhandled Rejection",
                    {
                        error,
                    }
                );
            }
        );

        process.on(
            "uncaughtException",
            (error) => {
                logger.error(
                    "Uncaught Exception",
                    {
                        error,
                    }
                );
            }
        );
    } catch (error) {
        logger.error(
            "Failed to start server",
            {
                error,
            }
        );

        process.exit(1);
    }
};

startServer();