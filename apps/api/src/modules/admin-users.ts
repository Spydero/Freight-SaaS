import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  adminCreateClientSchema,
  adminCreateOrgSchema,
  adminCreateStaffSchema,
} from "@elios/shared";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { logActivity, notifyUser } from "../lib/activity.js";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRoles("ADMIN"));

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "org"}-${Date.now().toString(36)}`;
}

adminUsersRouter.get("/users", async (_req, res, next) => {
  try {
    const memberships = await prisma.membership.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
    res.json({
      users: memberships.map((m) => ({
        membershipId: m.id,
        role: m.role,
        user: m.user,
        organization: m.organization,
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminUsersRouter.get("/organizations", async (_req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true, shipments: true, quotes: true } },
      },
    });
    res.json({ organizations });
  } catch (err) {
    next(err);
  }
});

adminUsersRouter.post("/organizations", async (req, res, next) => {
  try {
    const body = adminCreateOrgSchema.parse(req.body);
    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug: slugify(body.name),
        billingEmail: body.billingEmail?.toLowerCase(),
      },
    });
    await logActivity({
      organizationId: org.id,
      actorId: req.user!.userId,
      action: "org.created",
      entityType: "Organization",
      entityId: org.id,
    });
    res.status(201).json({ organization: org });
  } catch (err) {
    next(err);
  }
});

adminUsersRouter.post("/clients", async (req, res, next) => {
  try {
    const body = adminCreateClientSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest("Email already registered");

    let organizationId = body.organizationId;
    if (!organizationId) {
      const org = await prisma.organization.create({
        data: {
          name: body.companyName!,
          slug: slugify(body.companyName!),
          billingEmail: email,
        },
      });
      organizationId = org.id;
    } else {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw notFound("Organization not found");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        memberships: {
          create: {
            organizationId,
            role: "CLIENT",
          },
        },
      },
      include: {
        memberships: { include: { organization: true } },
      },
    });

    await notifyUser(
      user.id,
      "Account created by Ternline",
      `An admin created your client account. Sign in with ${email}.`,
    );

    await logActivity({
      organizationId,
      actorId: req.user!.userId,
      action: "user.client_created",
      entityType: "User",
      entityId: user.id,
      meta: { email },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "CLIENT",
        organization: user.memberships[0]?.organization,
      },
      temporaryPasswordNote: "Share the password you set with the client securely (demo).",
    });
  } catch (err) {
    next(err);
  }
});

adminUsersRouter.post("/staff", async (req, res, next) => {
  try {
    const body = adminCreateStaffSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest("Email already registered");

    // Staff belong to the admin's logistics org by default
    const organizationId = body.organizationId ?? req.user!.organizationId;
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw notFound("Organization not found");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        memberships: {
          create: {
            organizationId,
            role: body.role,
          },
        },
      },
    });

    await notifyUser(
      user.id,
      "Staff account created",
      `You were added as ${body.role}. Sign in with ${email}.`,
    );

    await logActivity({
      organizationId,
      actorId: req.user!.userId,
      action: "user.staff_created",
      entityType: "User",
      entityId: user.id,
      meta: { email, role: body.role },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: body.role,
        organizationId,
      },
    });
  } catch (err) {
    next(err);
  }
});
