import { Request, Response, NextFunction } from "express";
import { logger } from "../../utils/logger";
import multer from "multer";
import { Prisma } from "@prisma/client";

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(statusCode: number, message: string, errors?: any[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;

    // This is to make instanceof work correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static badRequest(message = "Bad request", errors?: any[]) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static conflict(message = "Resource conflict") {
    return new ApiError(409, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

// Main error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error("Error occurred", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle different types of errors

  // Handle our custom API errors
  if (err instanceof ApiError) {
    return void res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      errors: err.errors,
    });
  }

  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return void res.status(413).json({
        error: "File too large",
        message: "The uploaded file exceeds the maximum size limit (10MB)",
      });
    }

    return void res.status(400).json({
      error: "File upload error",
      message: err.message,
    });
  }

  // Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return void res.status(409).json({
        error: "Resource conflict",
        message: "A resource with this unique constraint already exists",
      });
    }

    if (err.code === "P2025") {
      return void res.status(404).json({
        error: "Resource not found",
        message: "The requested resource does not exist",
      });
    }

    return void res.status(400).json({
      error: "Database error",
      message: "An error occurred while processing your request",
    });
  }

  // Validation errors
  if (err.name === "ValidationError" || err.name === "JoiValidationError") {
    return void res.status(400).json({
      error: "Validation error",
      message: err.message,
      errors: (err as any).errors || [(err as any).message],
    });
  }

  // Authentication errors
  if (
    err.message.includes("authentication") ||
    err.message.includes("unauthorized")
  ) {
    return void res.status(401).json({
      error: "Authentication error",
      message: "You must be logged in to access this resource",
    });
  }

  // Authorization errors
  if (err.message.includes("permission") || err.message.includes("forbidden")) {
    return void res.status(403).json({
      error: "Authorization error",
      message: "You do not have permission to access this resource",
    });
  }

  // Default to 500 internal server error
  return void res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
  });
};

// Middleware for handling 404 Not Found errors
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
