import { Router } from "express";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@elios/shared";
import { prisma } from "../lib/prisma.js";
import { badRequest, unauthorized } from "../lib/errors.js";
import { SESSION_COOKIE, signSession } from "../lib/session.js";
import { env } from "../lib/env.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

export const authRouter = Router();

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) throw badRequest("Email already registered");

    const slugBase = body.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
    const slug = `${slugBase || "org"}-${Date.now().toString(36)}`;

    const passwordHash = await bcrypt.hash(body.password, 10);
    const org = await prisma.organization.create({
      data: {
        name: body.companyName,
        slug,
        billingEmail: body.email.toLowerCase(),
        members: {
          create: {
            role: "CLIENT",
            user: {
              create: {
                email: body.email.toLowerCase(),
                name: body.name,
                passwordHash,
              },
            },
          },
        },
      },
      include: { members: { include: { user: true } } },
    });

    const membership = org.members[0]!;
    const token = await signSession({
      userId: membership.userId,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role,
      organizationId: org.id,
      organizationName: org.name,
    });

    await logActivity({
      organizationId: org.id,
      actorId: membership.userId,
      action: "user.registered",
      entityType: "User",
      entityId: membership.userId,
    });

    res.cookie(SESSION_COOKIE, token, cookieOptions());
    res.status(201).json({
      user: {
        id: membership.userId,
        email: membership.user.email,
        name: membership.user.name,
        role: membership.role,
        organizationId: org.id,
        organizationName: org.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { memberships: { include: { organization: true }, take: 1 } },
    });
    if (!user) throw unauthorized("Invalid email or password");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid email or password");
    const membership = user.memberships[0];
    if (!membership) throw unauthorized("No organization membership");

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership.role,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
    });

    res.cookie(SESSION_COOKIE, token, cookieOptions());
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
        organizationId: membership.organizationId,
        organizationName: membership.organization.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").toLowerCase();
    if (!email) throw badRequest("Email required");
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Password reset (demo)",
          body: `Demo mode: use password "${env.DEMO_PASSWORD}" for seeded accounts, or register a new account.`,
        },
      });
    }
    res.json({
      ok: true,
      message: "If that email exists, a reset notice was added to in-app notifications (demo).",
    });
  } catch (err) {
    next(err);
  }
});
