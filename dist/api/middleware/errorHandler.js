"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.APIError = void 0;
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = require("../../utils/logger");
// Custom error class for API errors
class APIError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "APIError";
    }
}
exports.APIError = APIError;
// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    var _a;
    // Log the error
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.headers["x-request-id"] || "unknown",
    });
    // Handle known Prisma errors
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (err.code === "P2002") {
            return void res.status(409).json({
                error: "A record with this value already exists",
                field: ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) || "unknown",
            });
        }
        // Handle not found errors
        if (err.code === "P2025") {
            return void res.status(404).json({
                error: "Record not found",
            });
        }
        // Handle other Prisma errors
        return void res.status(400).json({
            error: "Database operation failed",
            code: err.code,
        });
    }
    // Handle custom API errors
    if (err instanceof APIError) {
        return void res.status(err.statusCode).json({
            error: err.message,
        });
    }
    // Handle unexpected errors
    const isProduction = process.env.NODE_ENV === "production";
    // In production, don't expose error details
    if (isProduction) {
        return void res.status(500).json({
            error: "An unexpected error occurred",
        });
    }
    // In development, return the full error for debugging
    return void res.status(500).json({
        error: err.message,
        stack: err.stack,
    });
};
exports.errorHandler = errorHandler;
