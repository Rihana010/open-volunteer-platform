// One place that answers "who is this admin and what may they touch?".
//
// The signed cookie proves who someone is; this file also checks the admin
// still exists and is active, so deactivating an admin cuts them off at once.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getSessionEmail as getVerifiedEmail,
  getSessionEmailFromToken as getVerifiedEmailFromToken,
} from "@/lib/session";

async function activeAdminEmail(email?: string) {
  if (!email) return undefined;

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: { isActive: true },
  });

  return admin?.isActive ? email : undefined;
}

/** Route handlers: email of the signed-in, active admin (else undefined). */
export async function getSessionEmail(request: Request) {
  return activeAdminEmail(await getVerifiedEmail(request));
}

/** Server components: same check, from the cookie value. */
export async function getSessionEmailFromToken(token?: string) {
  return activeAdminEmail(await getVerifiedEmailFromToken(token));
}

export async function getAdminFromRequest(request: Request) {
  const email = await getSessionEmail(request);
  return email ? prisma.adminUser.findUnique({ where: { email } }) : null;
}

type Admin = { id: number; role: string };

export const isSuperAdmin = (admin: Admin) => admin.role === "super_admin";

/** Prisma filter: super admins see every event, event admins only their own. */
export function eventScope(admin: Admin): Prisma.EventWhereInput {
  if (isSuperAdmin(admin)) return {};

  return {
    OR: [
      { createdByAdminId: admin.id },
      { adminAssignments: { some: { adminId: admin.id } } },
    ],
  };
}

export async function canManageEvent(admin: Admin, eventId: number) {
  const count = await prisma.event.count({
    where: { id: eventId, ...eventScope(admin) },
  });

  return count > 0;
}
