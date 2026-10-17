import type { NextFunction, Request, Response } from "express";
import type { Role } from "@elios/shared";
import { forbidden, unauthorized } from "../lib/errors.js";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "../lib/session.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const session = await verifySession(token);
    if (session) req.user = session;
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(unauthorized());
  const session = await verifySession(token);
  if (!session) return next(unauthorized("Invalid session"));
  req.user = session;
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
