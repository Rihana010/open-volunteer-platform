import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVolunteerConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inviteCode = String(body.inviteCode || "").trim();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const locationOrDepartment = String(
      body.locationOrDepartment || ""
    ).trim();

    const selectedDates = Array.isArray(body.selectedDates)
      ? body.selectedDates.map(String)
      : [];

    if (!inviteCode || !fullName || !email || !locationOrDepartment) {
      return NextResponse.json(
        {
          error:
            "Enter your name, company email, and location or department.",
        },
        { status: 400 }
      );
    }

    if (!email.endsWith("@weke.com")) {
      return NextResponse.json(
        { error: "Please use your company email address to volunteer." },
        { status: 400 }
      );
    }

    if (selectedDates.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one volunteer date." },
        { status: 400 }
      );
    }

    const eventRecord = await prisma.event.findUnique({
      where: { inviteCode },
      select: { id: true, date: true, endDate: true },
    });

    if (!eventRecord) {
      throw new Error("EVENT_NOT_AVAILABLE");
    }

    const eventId = eventRecord.id;

    // Only accept days that actually belong to this event.
    const allowedDates = new Set<string>();
    const lastDay = (eventRecord.endDate ?? eventRecord.date).toISOString().slice(0, 10);
    for (
      let day = new Date(eventRecord.date.toISOString().slice(0, 10) + "T12:00:00Z");
      day.toISOString().slice(0, 10) <= lastDay && allowedDates.size < 366;
      day.setUTCDate(day.getUTCDate() + 1)
    ) {
      allowedDates.add(day.toISOString().slice(0, 10));
    }

    if (!selectedDates.every((date: string) => allowedDates.has(date))) {
      return NextResponse.json(
        { error: "One of the selected days is not part of this event." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Lock this event row so concurrent registrations for the same
      // event cannot pass the capacity check simultaneously.
      const lockedEvents = await tx.$queryRaw<
        { id: number; isActive: boolean; volunteerCapacity: number }[]
      >`
        SELECT id, "isActive", "volunteerCapacity"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      const lockedEvent = lockedEvents[0];

      if (!lockedEvent || !lockedEvent.isActive) {
        throw new Error("EVENT_NOT_AVAILABLE");
      }

      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { signups: true },
      });

      if (!event) {
        throw new Error("EVENT_NOT_AVAILABLE");
      }

      if (event.signups.length >= lockedEvent.volunteerCapacity) {
        throw new Error("EVENT_FULL");
      }

      const duplicateSignup = event.signups.find((existingSignup) => {
        const sameEmail = existingSignup.email?.toLowerCase() === email;

        const sameNameAndDepartment =
          existingSignup.fullName.toLowerCase() === fullName.toLowerCase() &&
          existingSignup.locationOrDepartment.toLowerCase() ===
            locationOrDepartment.toLowerCase();

        return sameEmail || sameNameAndDepartment;
      });

      if (duplicateSignup) {
        throw new Error("DUPLICATE_SIGNUP");
      }

      return tx.volunteerSignup.create({
        data: {
          eventId,
          fullName,
          email,
          locationOrDepartment,
          selectedDates,
          status: "confirmed",
        },
      });
    });

    // Send email only after the database transaction commits.
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
      },
    });

    if (event) {
      try {
        await sendVolunteerConfirmationEmail({
          to: email,
          fullName,
          eventTitle: event.title,
          eventDate: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
        });
      } catch (emailError) {
        console.error("Failed to send volunteer confirmation email:", emailError);
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "EVENT_NOT_AVAILABLE":
          return NextResponse.json(
            { error: "This event is not available." },
            { status: 404 }
          );

        case "EVENT_FULL":
          return NextResponse.json(
            { error: "This event is currently full for volunteers." },
            { status: 409 }
          );

        case "DUPLICATE_SIGNUP":
          return NextResponse.json(
            { error: "You are already registered for this event." },
            { status: 409 }
          );
      }
    }

    console.error("Failed to create volunteer signup:", error);

    return NextResponse.json(
      { error: "Failed to submit volunteer request." },
      { status: 500 }
    );
  }
}