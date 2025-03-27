import { Request, Response, NextFunction } from "express";
export declare class ApiError extends Error {
    statusCode: number;
    errors?: any[];
    constructor(statusCode: number, message: string, errors?: any[]);
    static notFound(message?: string): ApiError;
    static badRequest(message?: string, errors?: any[]): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static conflict(message?: string): ApiError;
    static internal(message?: string): ApiError;
}
export declare const errorHandler: (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
