"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const supertokens_node_1 = __importDefault(require("supertokens-node"));
const express_2 = require("supertokens-node/framework/express");
const supertokens_1 = require("./config/supertokens");
const errorMiddleware_1 = require("./api/middleware/errorMiddleware");
const logger_1 = require("./utils/logger");
// Import routes using ES Module syntax
const accounts_1 = __importDefault(require("./api/routes/accounts"));
const transactions_1 = __importDefault(require("./api/routes/transactions"));
const categories_1 = __importDefault(require("./api/routes/categories"));
const statements_1 = __importDefault(require("./api/routes/statements"));
// Load environment variables
dotenv_1.default.config();
// Initialize SuperTokens
(0, supertokens_1.configureSupertokens)();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Add the request logger middleware
app.use(logger_1.requestLogger);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ["content-type", ...supertokens_node_1.default.getAllCORSHeaders()],
    credentials: true,
}));
app.use(express_1.default.json());
// Add request ID middleware
app.use((req, res, next) => {
    req.headers["x-request-id"] = req.headers["x-request-id"] || (0, uuid_1.v4)();
    next();
});
// SuperTokens middleware
app.use((0, express_2.middleware)());
// API routes
app.use("/api/accounts", accounts_1.default);
app.use("/api/transactions", transactions_1.default);
app.use("/api/categories", categories_1.default);
app.use("/api/statements", statements_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});
// Error handling middleware
// app.use(require('./api/middleware/errorMiddleware').errorHandler);
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
