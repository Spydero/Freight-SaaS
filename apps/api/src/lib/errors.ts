import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "APP_ERROR",
  ) {
    super(message);
  }
}

export function notFound(message = "Not found") {
  return new AppError(404, message, "NOT_FOUND");
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, message, "FORBIDDEN");
}

export function badRequest(message: string) {
  return new AppError(400, message, "BAD_REQUEST");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: err.issues[0]?.message ?? "Validation failed",
      code: "VALIDATION",
    });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
}
