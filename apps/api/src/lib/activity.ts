import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function logActivity(input: {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.activityLog.create({
    data: {
      organizationId: input.organizationId ?? undefined,
      actorId: input.actorId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      meta: input.meta,
    },
  });
}

export async function notifyUser(userId: string, title: string, body: string) {
  return prisma.notification.create({
    data: { userId, title, body },
  });
}
