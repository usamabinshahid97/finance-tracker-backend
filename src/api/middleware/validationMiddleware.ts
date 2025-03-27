import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiError } from "./errorMiddleware";

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

/**
 * Middleware for validating request data against Joi schemas
 * @param schema - Object containing Joi schemas for body, query, and/or params
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: { [key: string]: string[] } = {};

    // Validate request body if schema provided
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.body = error.details.map((detail) => detail.message);
      }
    }

    // Validate request query if schema provided
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.query = error.details.map((detail) => detail.message);
      }
    }

    // Validate request params if schema provided
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        validationErrors.params = error.details.map((detail) => detail.message);
      }
    }

    // If validation errors exist, return 400 Bad Request
    if (Object.keys(validationErrors).length > 0) {
      return next(ApiError.badRequest("Validation failed", Object.entries(validationErrors).map(([key, messages]) => ({ field: key, messages }))));
    }

    // Validation passed, continue to next middleware
    return next();
  };
};

/**
 * Common validation schemas that can be reused across routes
 */
export const validationSchemas = {
  /**
   * UUID parameter validation (for route params like /:id)
   */
  uuidParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      "string.guid": "The ID must be a valid UUID",
      "any.required": "ID is required",
    }),
  }),

  /**
   * Pagination query parameters
   */
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).max(100).default(25).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  }),
};
