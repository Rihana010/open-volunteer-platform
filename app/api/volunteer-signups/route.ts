import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVolunteerConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventId = Number(body.eventId);
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const locationOrDepartment = String(body.locationOrDepartment || "").trim();
    const selectedDates = Array.isArray(body.selectedDates)
  ? body.selectedDates.map(String)
  : [];

    if (!eventId || !fullName || !email || !locationOrDepartment) {
  return NextResponse.json(
    { error: "Please enter your name, company email, and location or department." },
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { signups: true },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { error: "This event is not available." },
        { status: 404 }
      );
    }

    if (event.signups.length >= event.volunteerCapacity) {
      return NextResponse.json(
        { error: "This event is currently full for volunteers." },
        { status: 409 }
      );
    }

    const duplicateSignup = event.signups.find((signup) => {
        const sameEmail =
            email && signup.email?.toLowerCase() === email.toLowerCase();

        const sameNameAndDepartment =
            signup.fullName.toLowerCase() === fullName.toLowerCase() &&
            signup.locationOrDepartment.toLowerCase() ===
            locationOrDepartment.toLowerCase();

        return sameEmail || sameNameAndDepartment;
        });

        if (duplicateSignup) {
        return NextResponse.json(
            { error: "You are already registered for this event." },
            { status: 409 }
        );
        }

    const signup = await prisma.volunteerSignup.create({
      data: {
        eventId,
        fullName,
        email: email || null,
        locationOrDepartment,
        selectedDates,
        status: "confirmed",
      },
    });

    await sendVolunteerConfirmationEmail({
  to: email,
  fullName,
  eventTitle: event.title,
  eventDate: event.date,
  startTime: event.startTime,
  endTime: event.endTime,
  location: event.location,
});

    return NextResponse.json(signup, { status: 201 });
  } catch (error) {
    console.error("Failed to create volunteer signup:", error);

    return NextResponse.json(
      { error: "Failed to submit volunteer request." },
      { status: 500 }
    );
  }
}