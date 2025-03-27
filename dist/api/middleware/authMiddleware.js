"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateSession = void 0;
const express_1 = require("supertokens-node/recipe/session/framework/express");
const session_1 = __importDefault(require("supertokens-node/recipe/session"));
// Import ApiError from the error middleware file
// Make sure this path correctly points to where errorMiddleware.ts is located
const errorMiddleware_1 = require("./errorMiddleware");
/**
 * Middleware to authenticate a user session and add userId to request
 */
const authenticateSession = (req, res, next) => {
    // First verify the session
    (0, express_1.verifySession)()(req, res, (err) => {
        if (err)
            return next(err);
        // Then add user ID to request
        session_1.default.getSession(req, res)
            .then(session => {
            if (session) {
                req.session = req.session || {};
                req.session.userId = session.getUserId();
                next();
            }
            else {
                next(new errorMiddleware_1.ApiError(401, "Not authenticated"));
            }
        })
            .catch(error => {
            next(new errorMiddleware_1.ApiError(401, "Authentication failed"));
        });
    });
};
exports.authenticateSession = authenticateSession;
/**
 * Middleware to check if user has admin role
 */
const requireAdmin = async (req, res, next) => {
    try {
        // Implement admin role check logic here
        // This is a placeholder - you'll need to implement your role checking logic
        next();
    }
    catch (error) {
        next(new errorMiddleware_1.ApiError(403, "Insufficient permissions"));
    }
};
exports.requireAdmin = requireAdmin;
