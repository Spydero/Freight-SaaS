import type { OrgApprovalStatus } from "@prisma/client";
import type { SessionPayload } from "./session.js";
import { forbidden } from "./errors.js";
import { prisma } from "./prisma.js";

/** CLIENT users may only touch their own organization's records. Staff (OPS/ADMIN) may touch all. */
export function assertOrgAccess(user: SessionPayload, organizationId: string) {
  if (user.role === "CLIENT" && user.organizationId !== organizationId) {
    throw forbidden("You do not have access to this company's records.");
  }
}

/** Prisma where-clause: clients are always scoped to their org; staff see all. */
export function orgScopeWhere(user: SessionPayload | undefined) {
  if (!user) return {};
  if (user.role === "CLIENT") return { organizationId: user.organizationId };
  return {};
}

/** Client quote actions require the company to be admin-approved. */
export async function assertClientOrgApproved(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { approvalStatus: true, name: true },
  });
  if (!org) throw forbidden("Organization not found");
  if (org.approvalStatus !== "APPROVED") {
    throw forbidden(
      org.approvalStatus === "REJECTED"
        ? "This company was rejected by Ternline admin. Contact support."
        : "Your company is pending admin approval. You can view quotes but cannot accept or reject yet.",
    );
  }
  return org;
}

export function canAcceptQuotes(role: string, approvalStatus?: OrgApprovalStatus | string | null) {
  if (role === "ADMIN" || role === "OPS") return true;
  return role === "CLIENT" && approvalStatus === "APPROVED";
}
