import { Request, Response, NextFunction } from "express";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import Session from "supertokens-node/recipe/session";
// Import ApiError from the error middleware file
// Make sure this path correctly points to where errorMiddleware.ts is located
import { ApiError } from "./errorMiddleware";

/**
 * Middleware to authenticate a user session and add userId to request
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
  // First verify the session
  verifySession()(req, res, (err) => {
    if (err) return next(err);
    
    // Then add user ID to request
    Session.getSession(req, res)
      .then(session => {
        if (session) {
          req.session = req.session || {};
          req.session.userId = session.getUserId();
          next();
        } else {
          next(new ApiError(401, "Not authenticated"));
        }
      })
      .catch(error => {
        next(new ApiError(401, "Authentication failed"));
      });
  });
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Implement admin role check logic here
    // This is a placeholder - you'll need to implement your role checking logic

    next();
  } catch (error) {
    next(new ApiError(403, "Insufficient permissions"));
  }
};
