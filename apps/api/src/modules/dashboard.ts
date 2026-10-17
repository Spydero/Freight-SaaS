import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { orgScopeWhere } from "../lib/org-access.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const isClient = req.user!.role === "CLIENT";
    const scope = orgScopeWhere(req.user);

    const [openLeads, pendingQuotes, activeShipments, onHold, unread] = await Promise.all([
      isClient
        ? Promise.resolve(0)
        : prisma.quoteRequest.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
      prisma.quote.count({
        where: {
          status: "SENT",
          ...scope,
        },
      }),
      prisma.shipment.count({
        where: {
          status: { in: ["BOOKED", "IN_TRANSIT", "AT_CUSTOMS", "OUT_FOR_DELIVERY"] },
          ...scope,
        },
      }),
      prisma.shipment.count({
        where: {
          status: "ON_HOLD",
          ...scope,
        },
      }),
      prisma.notification.count({
        where: { userId: req.user!.userId, readAt: null },
      }),
    ]);

    const recentShipments = await prisma.shipment.findMany({
      where: scope,
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        organization: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });

    res.json({
      kpis: { openLeads, pendingQuotes, activeShipments, onHold, unread },
      recentShipments,
    });
  } catch (err) {
    next(err);
  }
});
