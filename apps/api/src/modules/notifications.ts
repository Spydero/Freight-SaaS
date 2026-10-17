import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { readAt: new Date() },
    });
    res.json({ ok: notification.count > 0 });
  } catch (err) {
    next(err);
  }
});

export const activityRouter = Router();

activityRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const where =
      req.user!.role === "CLIENT"
        ? { organizationId: req.user!.organizationId }
        : {};
    const activity = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    });
    res.json({ activity });
  } catch (err) {
    next(err);
  }
});

export const searchRouter = Router();

searchRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ results: [] });

    const orgFilter =
      req.user!.role === "CLIENT" ? { organizationId: req.user!.organizationId } : {};

    const [shipments, quotes, leads] = await Promise.all([
      prisma.shipment.findMany({
        where: {
          ...orgFilter,
          OR: [
            { referenceCode: { contains: q, mode: "insensitive" } },
            { destinationLabel: { contains: q, mode: "insensitive" } },
            { originLabel: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
      }),
      prisma.quote.findMany({
        where: {
          ...orgFilter,
          OR: [
            { id: { contains: q } },
            { notes: { contains: q, mode: "insensitive" } },
            { destinationLabel: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        include: { organization: { select: { name: true } } },
      }),
      req.user!.role === "CLIENT"
        ? Promise.resolve([])
        : prisma.quoteRequest.findMany({
            where: {
              OR: [
                { companyName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { destination: { contains: q, mode: "insensitive" } },
              ],
            },
            take: 8,
          }),
    ]);

    res.json({
      results: [
        ...shipments.map((s) => ({
          type: "shipment" as const,
          id: s.id,
          label: s.referenceCode,
          subtitle: `${s.originLabel} → ${s.destinationLabel}`,
        })),
        ...quotes.map((qte) => ({
          type: "quote" as const,
          id: qte.id,
          label: `Quote ${qte.id.slice(-6).toUpperCase()}`,
          subtitle: qte.organization.name,
        })),
        ...leads.map((l) => ({
          type: "lead" as const,
          id: l.id,
          label: l.companyName,
          subtitle: l.destination,
        })),
      ],
    });
  } catch (err) {
    next(err);
  }
});

void logActivity;
