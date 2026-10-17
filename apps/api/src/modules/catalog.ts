import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

export const catalogRouter = Router();

catalogRouter.get("/services", async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ services });
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/ports", async (_req, res, next) => {
  try {
    const ports = await prisma.port.findMany({ orderBy: { name: "asc" } });
    res.json({ ports });
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/team", async (_req, res, next) => {
  try {
    const team = await prisma.teamMember.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ team });
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/testimonials", async (_req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ testimonials });
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/organizations", requireAuth, requireRoles("OPS", "ADMIN"), async (req, res, next) => {
  try {
    const clientsOnly = req.query.clientsOnly === "1" || req.query.clientsOnly === "true";
    const approvedOnly = req.query.approvedOnly === "1" || req.query.approvedOnly === "true";

    const organizations = await prisma.organization.findMany({
      where: {
        ...(approvedOnly ? { approvalStatus: "APPROVED" } : {}),
        ...(clientsOnly
          ? { members: { some: { role: "CLIENT" } } }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        approvalStatus: true,
      },
    });
    res.json({ organizations });
  } catch (err) {
    next(err);
  }
});

catalogRouter.post("/services", requireAuth, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const service = await prisma.service.create({
      data: {
        code: String(req.body.code).toUpperCase(),
        name: String(req.body.name),
        description: req.body.description,
        category: req.body.category ?? "MODE",
        sortOrder: Number(req.body.sortOrder ?? 0),
      },
    });
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
});
