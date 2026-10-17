import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const isClient = req.user!.role === "CLIENT";

    const [openLeads, pendingQuotes, activeShipments, onHold, unread] = await Promise.all([
      isClient
        ? Promise.resolve(0)
        : prisma.quoteRequest.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
      prisma.quote.count({
        where: {
          status: "SENT",
          ...(isClient ? { organizationId: orgId } : {}),
        },
      }),
      prisma.shipment.count({
        where: {
          status: { in: ["BOOKED", "IN_TRANSIT", "AT_CUSTOMS", "OUT_FOR_DELIVERY"] },
          ...(isClient ? { organizationId: orgId } : {}),
        },
      }),
      prisma.shipment.count({
        where: {
          status: "ON_HOLD",
          ...(isClient ? { organizationId: orgId } : {}),
        },
      }),
      prisma.notification.count({
        where: { userId: req.user!.userId, readAt: null },
      }),
    ]);

    const recentShipments = await prisma.shipment.findMany({
      where: isClient ? { organizationId: orgId } : {},
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
