import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

const admins = [
  {
    email: "superadmin@weke.com",
    fullName: "Super Admin",
    temporaryPassword: "ChangeMe123!",
    role: "super_admin",
  },
  {
    email: "admin@weke.com",
    fullName: "Admin",
    temporaryPassword: "ChangeMe123!",
    role: "event_admin",
  },
];

async function main() {
  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(admin.temporaryPassword, 10);

    const adminUser = await prisma.adminUser.upsert({
      where: { email },
      update: {
        fullName: admin.fullName,
        passwordHash,
        mustChangePassword: true,
        role: admin.role,
        isActive: true,
      },
      create: {
        email,
        fullName: admin.fullName,
        passwordHash,
        mustChangePassword: true,
        role: admin.role,
        isActive: true,
      },
    });

    console.log("Admin user saved:", adminUser.email);
    console.log("Temporary password:", admin.temporaryPassword);
  }
}

main()
  .catch((error) => {
    console.error("Script failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });