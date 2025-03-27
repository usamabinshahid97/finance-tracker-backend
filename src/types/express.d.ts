import { Session, SessionData } from "express-session";

declare global {
  namespace Express {
    interface Request {
      session: Session &
        Partial<SessionData> & {
          userId?: string;
          // Add any other session properties you need
        };
    }
  }
}
