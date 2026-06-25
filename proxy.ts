import { NextRequest, NextResponse } from "next/server";

function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    normalizedEmail.endsWith("@weke.com") &&
    getAllowedAdminEmails().includes(normalizedEmail)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminEmail = request.cookies.get("weke_admin_email")?.value;
  const isAuthorized = adminEmail ? isAllowedAdminEmail(adminEmail) : false;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  const isLogoutApi = pathname === "/api/admin/logout";

  if (isLoginPage || isLoginApi || isLogoutApi) {
    return NextResponse.next();
  }

  if ((isAdminPage || isAdminApi) && !isAuthorized) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};