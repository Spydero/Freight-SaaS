import { Router } from "express";
import { leadSchema } from "@elios/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { logActivity, notifyUser } from "../lib/activity.js";
import { notFound } from "../lib/errors.js";

export const leadsRouter = Router();

leadsRouter.post("/", async (req, res, next) => {
  try {
    const body = leadSchema.parse(req.body);
    const service = body.serviceCode
      ? await prisma.service.findUnique({ where: { code: body.serviceCode } })
      : await prisma.service.findFirst({ where: { active: true }, orderBy: { sortOrder: "asc" } });

    const lead = await prisma.quoteRequest.create({
      data: {
        contactName: body.fullName,
        companyName: body.companyName,
        email: body.email.toLowerCase(),
        destination: body.destination,
        message: body.message,
        serviceId: service?.id,
      },
      include: { service: true },
    });

    const ops = await prisma.membership.findMany({
      where: { role: { in: ["OPS", "ADMIN"] } },
      select: { userId: true },
    });
    await Promise.all(
      ops.map((m) =>
        notifyUser(
          m.userId,
          "New shipment lead",
          `${body.companyName} requested ${service?.name ?? "logistics"} to ${body.destination}.`,
        ),
      ),
    );

    await logActivity({
      action: "lead.created",
      entityType: "QuoteRequest",
      entityId: lead.id,
      meta: { companyName: body.companyName },
    });

    res.status(201).json({ lead });
  } catch (err) {
    next(err);
  }
});

leadsRouter.get("/", requireAuth, requireRoles("OPS", "ADMIN"), async (_req, res, next) => {
  try {
    const leads = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { service: true, quotes: { select: { id: true, status: true } } },
    });
    res.json({ leads });
  } catch (err) {
    next(err);
  }
});

leadsRouter.patch("/:id/status", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const status = req.body?.status;
    const lead = await prisma.quoteRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: { service: true },
    });
    res.json({ lead });
  } catch {
    next(notFound("Lead not found"));
  }
});
