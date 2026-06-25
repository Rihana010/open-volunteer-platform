import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!adminUser?.isActive) {
    return NextResponse.json(
      { error: "This admin account has been deactivated." },
      { status: 403 }
    );
  }

  if (!adminUser) {
    return NextResponse.json(
      { error: "Invalid admin email or password." },
      { status: 401 }
    );
  }

  const passwordIsValid = await bcrypt.compare(
    password,
    adminUser.passwordHash
  );

  if (!passwordIsValid) {
    return NextResponse.json(
      { error: "Invalid admin email or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    mustChangePassword: adminUser.mustChangePassword,
  });

  response.cookies.set("weke_admin_email", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}