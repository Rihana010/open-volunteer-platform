import Link from "next/link";
import { prisma } from "@/lib/db";
import { EventArchiveButton } from "@/components/EventArchiveButton";
import Image from "next/image";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";


export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminEventsPage() {
  const today = new Date();

const startOfCurrentMonth = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

await prisma.event.updateMany({
  where: {
    isActive: true,
    OR: [
      {
        endDate: {
          lt: startOfCurrentMonth,
        },
      },
      {
        endDate: null,
        date: {
          lt: startOfCurrentMonth,
        },
      },
    ],
  },
  data: {
    isActive: false,
  },
});

const archivedEventCount = await prisma.event.count({
  where: {
    isActive: false,
  },
});

const archivedEventDisplay =
  archivedEventCount > 30
    ? "30+"
    : archivedEventCount.toString();

  const events = await prisma.event.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      date: "asc",
    },
    include: {
      signups: true,
      createdByAdmin: true,
      adminAssignments: {
        include: {
          admin: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-4 inline-flex rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                ← Back to Dashboard
              </Link>

              <div className="mb-4">
                <Image
                  src="/weke-logo.png"
                  alt="Weke Logo"
                  width={180}
                  height={60}
                  priority
                />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--ovp-blue)]">
                Admin Portal
              </p>

              <h1 className="text-3xl font-bold text-slate-950">
                Manage Events
              </h1>

              <p className="mt-3 text-slate-600">
                Create, edit, archive, and review volunteer capacity for
                events.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <AdminLogoutButton />

              <Link
                href="/admin/events/archive"
                className="rounded-xl bg-slate-100 px-4 py-2 text-center font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Archived Events ({archivedEventDisplay})
              </Link>

              <Link
                href="/admin/events/new"
                className="rounded-xl bg-[var(--ovp-green)] px-4 py-2 text-center font-semibold text-white transition hover:bg-[#78A935]"
              >
                + Create Event
              </Link>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Primary Contact</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Volunteers</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => {
                const signupCount = event.signups.length;

                return (
                  <tr key={event.id} className="border-t border-slate-200">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.startTime} - {event.endTime}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {event.adminAssignments[0]?.admin.fullName ||
                        event.adminAssignments[0]?.admin.email ||
                        event.createdByAdmin?.fullName ||
                        event.createdByAdmin?.email ||
                        "Unassigned"}
                    </td>

                    <td className="px-4 py-4">{formatDate(event.date)}</td>

                    <td className="px-4 py-4">{event.location}</td>

                    <td className="px-4 py-4">
                      {signupCount}/{event.volunteerCapacity}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          event.isActive
                            ? "bg-[var(--ovp-green-100)] text-[var(--ovp-green)]"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {event.isActive ? "Active" : "Archived"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/admin/events/${event.id}/volunteers`}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[var(--ovp-blue)] hover:bg-[var(--ovp-blue-100)]"
                        >
                          View Signups
                        </Link>

                        <EventArchiveButton
                          eventId={event.id}
                          isActive={event.isActive}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {events.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No events have been created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}