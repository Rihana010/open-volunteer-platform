import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function escapeCsvValue(value: string | null | undefined) {
  const safeValue = value ?? "";
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);

  if (!id) {
    return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      signups: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const rows = [
    ["Name", "Email", "Branch/Department", "Volunteer Dates", "Status", "Signup Date"],
    ...event.signups.map((signup) => [
      signup.fullName,
      signup.email || "",
      signup.locationOrDepartment,
      signup.selectedDates.join("; "),
      signup.status,
      signup.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  const fileName = `${event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-volunteers.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}