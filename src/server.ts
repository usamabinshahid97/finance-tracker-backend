import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import supertokens from "supertokens-node";
import { middleware } from "supertokens-node/framework/express";
import { configureSupertokens } from "./config/supertokens";
import { errorHandler, notFoundHandler } from "./api/middleware/errorMiddleware";
import { logger, requestLogger } from "./utils/logger";

// Import routes using ES Module syntax
import accountRoutes from "./api/routes/accounts";
import transactionRoutes from "./api/routes/transactions";
import categoryRoutes from "./api/routes/categories";
import statementRoutes from "./api/routes/statements";

// Load environment variables
dotenv.config();

// Initialize SuperTokens
configureSupertokens();

// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Add the request logger middleware
app.use(requestLogger);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);
app.use(express.json());

// Add request ID middleware
app.use((req, res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || uuidv4();
  next();
});

// SuperTokens middleware
app.use(middleware());

// API routes
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/statements", statementRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});
// Error handling middleware
// app.use(require('./api/middleware/errorMiddleware').errorHandler);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;