import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./lib/env.js";
import { errorHandler } from "./lib/errors.js";
import { optionalAuth } from "./middleware/auth.js";
import { authRouter } from "./modules/auth.js";
import { leadsRouter } from "./modules/leads.js";
import { quotesRouter } from "./modules/quotes.js";
import { shipmentsRouter, trackRouter } from "./modules/shipments.js";
import { catalogRouter } from "./modules/catalog.js";
import {
  activityRouter,
  notificationsRouter,
  searchRouter,
} from "./modules/notifications.js";
import { dashboardRouter } from "./modules/dashboard.js";
import { adminUsersRouter } from "./modules/admin-users.js";

export function createApp() {
  const app = express();
  // Avoid 304/ETag reuse of stale shipment JSON across Ops→Client checks
  app.set("etag", false);

  const allowedOrigins = new Set(
    [
      env.WEB_ORIGIN,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ].filter(Boolean),
  );
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser tools (no Origin) and local web origins
        if (!origin || allowedOrigins.has(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(optionalAuth);

  app.get("/health", (_req, res) => res.json({ ok: true, service: "ternline-api" }));

  app.use("/v1/auth", authRouter);
  app.use("/v1/leads", leadsRouter);
  app.use("/v1/quotes", quotesRouter);
  app.use("/v1/shipments", shipmentsRouter);
  app.use("/v1/track", trackRouter);
  app.use("/v1/catalog", catalogRouter);
  app.use("/v1/notifications", notificationsRouter);
  app.use("/v1/activity", activityRouter);
  app.use("/v1/search", searchRouter);
  app.use("/v1/dashboard", dashboardRouter);
  app.use("/v1/admin", adminUsersRouter);

  app.use(errorHandler);
  return app;
}
