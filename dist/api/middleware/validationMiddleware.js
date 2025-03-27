"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchemas = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const errorMiddleware_1 = require("./errorMiddleware");
/**
 * Middleware for validating request data against Joi schemas
 * @param schema - Object containing Joi schemas for body, query, and/or params
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const validationErrors = {};
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
            return next(errorMiddleware_1.ApiError.badRequest("Validation failed", Object.entries(validationErrors).map(([key, messages]) => ({ field: key, messages }))));
        }
        // Validation passed, continue to next middleware
        return next();
    };
};
exports.validateRequest = validateRequest;
/**
 * Common validation schemas that can be reused across routes
 */
exports.validationSchemas = {
    /**
     * UUID parameter validation (for route params like /:id)
     */
    uuidParam: joi_1.default.object({
        id: joi_1.default.string().uuid().required().messages({
            "string.guid": "The ID must be a valid UUID",
            "any.required": "ID is required",
        }),
    }),
    /**
     * Pagination query parameters
     */
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1).messages({
            "number.base": "Page must be a number",
            "number.integer": "Page must be an integer",
            "number.min": "Page must be at least 1",
        }),
        limit: joi_1.default.number().integer().min(1).max(100).default(25).messages({
            "number.base": "Limit must be a number",
            "number.integer": "Limit must be an integer",
            "number.min": "Limit must be at least 1",
            "number.max": "Limit cannot exceed 100",
        }),
    }),
};
