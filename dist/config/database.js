"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
// Define extended client with proper typings for the events
class ExtendedPrismaClient extends client_1.PrismaClient {
    constructor(options) {
        super(options);
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
// Create the client instance
exports.prisma = new ExtendedPrismaClient({
    log: process.env.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "query" },
            { emit: "stdout", level: "error" },
        ]
        : [{ emit: "stdout", level: "error" }],
});
// Set up logging in development mode - access the _previewFeatures
if (process.env.NODE_ENV === "development") {
    // We'll use a middleware approach for logging instead of events
    exports.prisma.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        logger_1.logger.debug("Prisma Query", {
            model: params.model,
            action: params.action,
            params: params.args,
            duration: `${after - before}ms`,
        });
        return result;
    });
}
// Log database errors using traditional try/catch
// We'll enhance error handling in our services
// Connect to database function
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info("Successfully connected to the database");
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to the database", { error });
        process.exit(1);
    }
}
// Disconnect from database function
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info("Successfully disconnected from the database");
    }
    catch (error) {
        logger_1.logger.error("Error disconnecting from the database", { error });
    }
}
// Handle process termination
process.on("SIGINT", async () => {
    logger_1.logger.info("SIGINT received, shutting down gracefully");
    await disconnectDatabase();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    logger_1.logger.info("SIGTERM received, shutting down gracefully");
    await disconnectDatabase();
    process.exit(0);
});
exports.default = { prisma: exports.prisma, connectDatabase, disconnectDatabase };
