import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionEmailFromToken } from "@/lib/adminAccess";
import { SESSION_COOKIE } from "@/lib/session";

/** For admin pages: the signed-in admin, or a redirect to the sign-in gateway. */
export async function requireAdmin() {
  const store = await cookies();
  const email = await getSessionEmailFromToken(store.get(SESSION_COOKIE)?.value);

  const admin = email
    ? await prisma.adminUser.findUnique({ where: { email } })
    : null;

  if (!admin) redirect("/?as=admin");

  return admin;
}
