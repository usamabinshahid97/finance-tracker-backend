import { Request, Response, NextFunction } from "express";
import Joi from "joi";
interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}
/**
 * Middleware for validating request data against Joi schemas
 * @param schema - Object containing Joi schemas for body, query, and/or params
 */
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Common validation schemas that can be reused across routes
 */
export declare const validationSchemas: {
    /**
     * UUID parameter validation (for route params like /:id)
     */
    uuidParam: Joi.ObjectSchema<any>;
    /**
     * Pagination query parameters
     */
    pagination: Joi.ObjectSchema<any>;
};
export {};
