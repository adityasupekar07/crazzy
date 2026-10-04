import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import logger from "./config/logger.js";

import { prisma } from "./db/index.js";

import {
    connectRedis,
    disconnectRedis,
} from "./config/redis.js";

const PORT =
    Number(process.env.PORT) || 5000;


 // START SERVER


const startServer = async () => {
    try {
        // TEST DATABASE CONNECTION
        try {
            await prisma.$connect();
            logger.info("✅ PostgreSQL connected");
        } catch (dbError: any) {
            logger.warn(
                "⚠️ PostgreSQL database not reachable yet. Please configure valid DATABASE_URL in backend/.env or start PostgreSQL.",
                { message: dbError?.message || dbError }
            );
        }

        // await connectRedis();

        const server = app.listen(
            PORT, "0.0.0.0",
            () => {
                logger.info(
                    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
                );
            }
        );

        
        // GRACEFUL SHUTDOWN
         

        const shutdown = async (
            signal: string
        ) => {
            logger.warn(
                `🛑 ${signal} received`
            );

            server.close(async () => {
                await prisma.$disconnect();
                await disconnectRedis();

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

    
        // UNHANDLED ERRORS
        

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