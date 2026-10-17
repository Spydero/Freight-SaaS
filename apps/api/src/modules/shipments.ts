import { Router } from "express";
import {
  shipmentCommentSchema,
  shipmentEventSchema,
  updateShipmentSchema,
} from "@elios/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { forbidden, notFound } from "../lib/errors.js";
import { logActivity, notifyUser } from "../lib/activity.js";
import { createTrackingToken, hashToken } from "../lib/tokens.js";

export const shipmentsRouter = Router();

function orgScope(user: Express.Request["user"]) {
  if (!user) return {};
  if (user.role === "CLIENT") return { organizationId: user.organizationId };
  return {};
}

shipmentsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, mode, q } = req.query;
    const shipments = await prisma.shipment.findMany({
      where: {
        ...orgScope(req.user),
        ...(status ? { status: String(status) as never } : {}),
        ...(mode ? { mode: String(mode) as never } : {}),
        ...(q
          ? {
              OR: [
                { referenceCode: { contains: String(q), mode: "insensitive" } },
                { originLabel: { contains: String(q), mode: "insensitive" } },
                { destinationLabel: { contains: String(q), mode: "insensitive" } },
                { commodity: { contains: String(q), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { events: true, comments: true, documents: true } },
      },
    });
    res.json({ shipments });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.get("/kanban", requireAuth, async (req, res, next) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: {
        ...orgScope(req.user),
        status: { not: "CANCELLED" },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    const columns: Record<string, typeof shipments> = {};
    for (const s of shipments) {
      (columns[s.status] ??= []).push(s);
    }
    res.json({ columns, shipments });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.get("/analytics", requireAuth, async (req, res, next) => {
  try {
    const where = orgScope(req.user);
    const shipments = await prisma.shipment.findMany({
      where,
      select: { status: true, mode: true },
    });
    const byStatus: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    for (const s of shipments) {
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      byMode[s.mode] = (byMode[s.mode] ?? 0) + 1;
    }
    res.json({
      total: shipments.length,
      byStatus,
      byMode,
    });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.get("/export.csv", requireAuth, async (req, res, next) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: orgScope(req.user),
      orderBy: { createdAt: "desc" },
      include: { organization: true, assignee: true },
    });
    const header = [
      "referenceCode",
      "organization",
      "status",
      "mode",
      "origin",
      "destination",
      "assignee",
      "eta",
    ];
    const rows = shipments.map((s) =>
      [
        s.referenceCode,
        s.organization.name,
        s.status,
        s.mode,
        s.originLabel,
        s.destinationLabel,
        s.assignee?.name ?? "",
        s.eta?.toISOString() ?? "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=shipments.csv");
    res.send([header.join(","), ...rows].join("\n"));
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        organization: true,
        assignee: { select: { id: true, name: true, email: true } },
        events: { orderBy: { occurredAt: "asc" }, include: { createdBy: { select: { name: true } } } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
        documents: true,
        quote: { include: { lineItems: true } },
        originPort: true,
        destinationPort: true,
      },
    });
    if (!shipment) throw notFound("Shipment not found");
    if (req.user!.role === "CLIENT" && shipment.organizationId !== req.user!.organizationId) {
      throw forbidden();
    }
    res.json({ shipment });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.patch("/:id", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const body = updateShipmentSchema.parse(req.body);
    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: {
        status: body.status,
        holdReason: body.holdReason === null ? null : body.holdReason,
        assigneeId: body.assigneeId === null ? null : body.assigneeId,
        etd: body.etd ? new Date(body.etd) : body.etd === null ? null : undefined,
        eta: body.eta ? new Date(body.eta) : body.eta === null ? null : undefined,
      },
      include: { organization: true },
    });

    if (body.status === "ON_HOLD" && body.holdReason) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          title: "Shipment on hold",
          description: body.holdReason,
          occurredAt: new Date(),
          createdById: req.user!.userId,
        },
      });
    }

    await logActivity({
      organizationId: shipment.organizationId,
      actorId: req.user!.userId,
      action: "shipment.updated",
      entityType: "Shipment",
      entityId: shipment.id,
      meta: body,
    });

    res.json({ shipment });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.post("/:id/events", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const body = shipmentEventSchema.parse(req.body);
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) throw notFound("Shipment not found");

    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        title: body.title,
        description: body.description,
        location: body.location,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        createdById: req.user!.userId,
      },
    });

    if (body.status) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: body.status },
      });
    }

    const clients = await prisma.membership.findMany({
      where: { organizationId: shipment.organizationId, role: "CLIENT" },
    });
    await Promise.all(
      clients.map((m) =>
        notifyUser(m.userId, "Shipment update", `${shipment.referenceCode}: ${body.title}`),
      ),
    );

    await logActivity({
      organizationId: shipment.organizationId,
      actorId: req.user!.userId,
      action: "shipment.event_added",
      entityType: "ShipmentEvent",
      entityId: event.id,
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const body = shipmentCommentSchema.parse(req.body);
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) throw notFound("Shipment not found");
    if (req.user!.role === "CLIENT" && shipment.organizationId !== req.user!.organizationId) {
      throw forbidden();
    }
    const comment = await prisma.shipmentComment.create({
      data: {
        shipmentId: shipment.id,
        authorId: req.user!.userId,
        body: body.body,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

shipmentsRouter.post("/:id/tracking-link", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) throw notFound("Shipment not found");
    const token = createTrackingToken();
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        trackingTokenHash: token.hash,
        trackingTokenHint: token.hint,
      },
    });
    res.json({
      trackingToken: token.raw,
      urlPath: `/track/${token.raw}`,
    });
  } catch (err) {
    next(err);
  }
});

export const trackRouter = Router();

trackRouter.get("/:token", async (req, res, next) => {
  try {
    const hash = hashToken(req.params.token);
    const shipment = await prisma.shipment.findUnique({
      where: { trackingTokenHash: hash },
      include: {
        events: { orderBy: { occurredAt: "asc" } },
        organization: { select: { name: true } },
      },
    });
    if (!shipment) throw notFound("Tracking link invalid");
    res.json({
      shipment: {
        referenceCode: shipment.referenceCode,
        status: shipment.status,
        mode: shipment.mode,
        originLabel: shipment.originLabel,
        destinationLabel: shipment.destinationLabel,
        etd: shipment.etd,
        eta: shipment.eta,
        holdReason: shipment.holdReason,
        organizationName: shipment.organization.name,
        events: shipment.events,
      },
    });
  } catch (err) {
    next(err);
  }
});
