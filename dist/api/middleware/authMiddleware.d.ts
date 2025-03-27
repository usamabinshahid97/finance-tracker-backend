import { Request, Response, NextFunction } from "express";
/**
 * Middleware to authenticate a user session and add userId to request
 */
export declare const authenticateSession: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has admin role
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
