import { Router } from "express";
import { createQuoteSchema } from "@elios/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { logActivity, notifyUser } from "../lib/activity.js";
import { assertClientOrgApproved, assertOrgAccess, orgScopeWhere } from "../lib/org-access.js";
import { createTrackingToken, makeReferenceCode } from "../lib/tokens.js";

export const quotesRouter = Router();

quotesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const quotes = await prisma.quote.findMany({
      where: orgScopeWhere(req.user),
      orderBy: { createdAt: "desc" },
      include: {
        lineItems: true,
        organization: { select: { id: true, name: true } },
        shipment: { select: { id: true, referenceCode: true, status: true } },
        quoteRequest: true,
      },
    });
    res.json({ quotes });
  } catch (err) {
    next(err);
  }
});

quotesRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        lineItems: true,
        organization: true,
        shipment: true,
        quoteRequest: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!quote) throw notFound("Quote not found");
    assertOrgAccess(req.user!, quote.organizationId);
    res.json({ quote });
  } catch (err) {
    next(err);
  }
});

quotesRouter.post("/", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const body = createQuoteSchema.parse(req.body);
    const total = body.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

    const quote = await prisma.quote.create({
      data: {
        organizationId: body.organizationId,
        quoteRequestId: body.quoteRequestId,
        status: "SENT",
        currency: body.currency,
        validUntil: new Date(body.validUntil),
        notes: body.notes,
        total,
        mode: body.mode,
        originLabel: body.originLabel,
        destinationLabel: body.destinationLabel,
        weightKg: body.weightKg,
        packageCount: body.packageCount,
        containerCount: body.containerCount,
        commodity: body.commodity,
        createdById: req.user!.userId,
        lineItems: {
          create: body.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
      include: { lineItems: true, organization: true },
    });

    if (body.quoteRequestId) {
      await prisma.quoteRequest.update({
        where: { id: body.quoteRequestId },
        data: { status: "QUOTED", organizationId: body.organizationId },
      });
    }

    const clients = await prisma.membership.findMany({
      where: { organizationId: body.organizationId, role: "CLIENT" },
    });
    await Promise.all(
      clients.map((m) =>
        notifyUser(
          m.userId,
          "New quote ready",
          `A quote totaling ${body.currency} ${total.toFixed(2)} is ready for review.`,
        ),
      ),
    );

    await logActivity({
      organizationId: body.organizationId,
      actorId: req.user!.userId,
      action: "quote.sent",
      entityType: "Quote",
      entityId: quote.id,
      meta: { total },
    });

    res.status(201).json({ quote });
  } catch (err) {
    next(err);
  }
});

quotesRouter.post("/:id/accept", requireAuth, requireRoles("CLIENT", "ADMIN"), async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { shipment: true, organization: true },
    });
    if (!quote) throw notFound("Quote not found");
    assertOrgAccess(req.user!, quote.organizationId);
    if (req.user!.role === "CLIENT") {
      await assertClientOrgApproved(quote.organizationId);
    }
    if (quote.status !== "SENT" && quote.status !== "REVISION_REQUESTED") {
      throw badRequest("Quote cannot be accepted in its current status");
    }
    if (quote.shipment) throw badRequest("Quote already converted to a shipment");

    const count = await prisma.shipment.count();
    const token = createTrackingToken();

    const shipment = await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED" },
      });
      return tx.shipment.create({
        data: {
          organizationId: quote.organizationId,
          quoteId: quote.id,
          referenceCode: makeReferenceCode(count + 1),
          mode: quote.mode,
          status: "BOOKED",
          originLabel: quote.originLabel ?? "Origin TBD",
          destinationLabel: quote.destinationLabel ?? "Destination TBD",
          weightKg: quote.weightKg,
          packageCount: quote.packageCount,
          containerCount: quote.containerCount,
          commodity: quote.commodity,
          trackingTokenHash: token.hash,
          trackingTokenHint: token.hint,
          assigneeId: quote.createdById,
          events: {
            create: {
              title: "Shipment booked",
              description: "Quote accepted and shipment created.",
              occurredAt: new Date(),
              createdById: req.user!.userId,
            },
          },
        },
      });
    });

    await notifyUser(
      quote.createdById,
      "Quote accepted",
      `${quote.organization.name} accepted quote — shipment ${shipment.referenceCode} created.`,
    );

    await logActivity({
      organizationId: quote.organizationId,
      actorId: req.user!.userId,
      action: "quote.accepted",
      entityType: "Shipment",
      entityId: shipment.id,
    });

    res.json({
      shipment: {
        ...shipment,
        trackingToken: token.raw,
      },
    });
  } catch (err) {
    next(err);
  }
});

quotesRouter.post("/:id/reject", requireAuth, requireRoles("CLIENT", "ADMIN"), async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id } });
    if (!quote) throw notFound("Quote not found");
    assertOrgAccess(req.user!, quote.organizationId);
    if (req.user!.role === "CLIENT") {
      await assertClientOrgApproved(quote.organizationId);
    }
    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "REJECTED" },
    });
    res.json({ quote: updated });
  } catch (err) {
    next(err);
  }
});

quotesRouter.post("/:id/request-revision", requireAuth, requireRoles("CLIENT"), async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id } });
    if (!quote) throw notFound("Quote not found");
    assertOrgAccess(req.user!, quote.organizationId);
    await assertClientOrgApproved(quote.organizationId);
    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "REVISION_REQUESTED", notes: req.body?.notes ?? quote.notes },
    });
    await notifyUser(quote.createdById, "Revision requested", "A client requested changes to a quote.");
    res.json({ quote: updated });
  } catch (err) {
    next(err);
  }
});

quotesRouter.get("/:id/pdf-data", requireAuth, async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true, organization: true, createdBy: true },
    });
    if (!quote) throw notFound("Quote not found");
    assertOrgAccess(req.user!, quote.organizationId);
    res.json({
      pdf: {
        title: `Ternline Quote ${quote.id.slice(-6).toUpperCase()}`,
        organization: quote.organization.name,
        currency: quote.currency,
        total: Number(quote.total),
        validUntil: quote.validUntil,
        notes: quote.notes,
        lineItems: quote.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: Number(li.unitPrice),
          amount: li.quantity * Number(li.unitPrice),
        })),
        preparedBy: quote.createdBy.name,
      },
    });
  } catch (err) {
    next(err);
  }
});
