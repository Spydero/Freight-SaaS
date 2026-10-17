import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  adminCreateClientSchema,
  adminCreateOrgSchema,
  adminCreateStaffSchema,
  adminOrgApprovalSchema,
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
      orderBy: [{ approvalStatus: "asc" }, { name: "asc" }],
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
        // Admin-created companies are pre-verified
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
        approvedById: req.user!.userId,
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

adminUsersRouter.patch("/organizations/:id/approval", async (req, res, next) => {
  try {
    const body = adminOrgApprovalSchema.parse(req.body);
    const existing = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Organization not found");

    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: body.status,
        approvedAt: body.status === "APPROVED" ? new Date() : null,
        approvedById: body.status === "APPROVED" ? req.user!.userId : null,
        rejectionReason: body.status === "REJECTED" ? body.rejectionReason ?? "Rejected by admin" : null,
      },
    });

    const clients = await prisma.membership.findMany({
      where: { organizationId: org.id, role: "CLIENT" },
    });
    await Promise.all(
      clients.map((m) =>
        notifyUser(
          m.userId,
          body.status === "APPROVED" ? "Company approved" : "Company rejected",
          body.status === "APPROVED"
            ? `${org.name} is approved. You can now accept and reject quotations.`
            : `${org.name} was not approved. ${body.rejectionReason ?? ""}`.trim(),
        ),
      ),
    );

    await logActivity({
      organizationId: org.id,
      actorId: req.user!.userId,
      action: body.status === "APPROVED" ? "org.approved" : "org.rejected",
      entityType: "Organization",
      entityId: org.id,
    });

    res.json({ organization: org });
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
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedById: req.user!.userId,
        },
      });
      organizationId = org.id;
    } else {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw notFound("Organization not found");
      // Attaching a user to an existing company does not auto-approve; admin must approve PENDING orgs.
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
