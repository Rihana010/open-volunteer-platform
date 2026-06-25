import Link from "next/link";
import { prisma } from "@/lib/db";
import Image from "next/image";

type VolunteerPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventVolunteersPage({
  params,
}: VolunteerPageProps) {
  const { eventId } = await params;
  const id = Number(eventId);

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
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          Event not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
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
                Volunteer Signups
              </h1>

              <p className="mt-3 text-slate-600">
                {event.title} · {formatDate(event.date)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {event.signups.length}/{event.volunteerCapacity} volunteer slots filled
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <a
                    href={`/api/admin/events/${event.id}/volunteers/export`}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                    Export CSV
                </a>

                <Link
                    href="/admin/events"
                    className="rounded-xl bg-slate-100 px-4 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                    Back to Events
                </Link>
                </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Branch/Department</th>
                <th className="px-4 py-3 font-semibold">Volunteer Dates</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Signup Date</th>
              </tr>
            </thead>

            <tbody>
              {event.signups.map((signup) => (
                <tr key={signup.id} className="border-t border-slate-200">
                  <td className="px-4 py-4 font-semibold text-slate-950">
                    {signup.fullName}
                  </td>

                  <td className="px-4 py-4">
                    {signup.email || "—"}
                  </td>

                  <td className="px-4 py-4">
                    {signup.locationOrDepartment}
                  </td>

                  <td className="px-4 py-4">
                    {signup.selectedDates.length > 0
                      ? signup.selectedDates
                          .sort((a, b) => a.localeCompare(b))
                          .map((date) => {
                            const d = new Date(`${date}T12:00:00`);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          })
                          .join(", ")
                      : "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[var(--ovp-green-100)] px-3 py-1 text-xs font-semibold text-[var(--ovp-green)]n-800">
                      {signup.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {formatDate(signup.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {event.signups.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No volunteers have signed up for this event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}