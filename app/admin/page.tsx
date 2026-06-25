import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const adminEmail = cookieStore.get("weke_admin_email")?.value;

  const currentAdmin = adminEmail
    ? await prisma.adminUser.findUnique({
        where: {
          email: decodeURIComponent(adminEmail).toLowerCase(),
        },
      })
    : null;

  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const [
    activeEvents,
    archivedEvents,
    totalSignups,
    upcomingEvents,
  ] = await Promise.all([
    prisma.event.count({
      where: { isActive: true },
    }),
    prisma.event.count({
      where: { isActive: false },
    }),
    prisma.volunteerSignup.count(),
    prisma.event.findMany({
      where: {
        isActive: true,
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 5,
      include: {
        signups: true,
      },
    }),
  ]);

  const totalOpenSlots = upcomingEvents.reduce((total, event) => {
    return total + Math.max(event.volunteerCapacity - event.signups.length, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

              <h1 className="text-3xl font-bold text-slate-950">
                Events Admin Dashboard
              </h1>

              <p className="mt-3 text-slate-600">
                Manage events, volunteer capacity, and event signups.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Active Events
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {activeEvents}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Archived Events
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {archivedEvents}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Total Signups
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {totalSignups}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Open Slots
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {totalOpenSlots}
            </p>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/events"
          className="block rounded-3xl bg-[var(--ovp-blue)] p-6 text-white shadow-sm transition hover:bg-[var(--ovp-blue-dark)]"
        >
          <h2 className="text-xl font-bold text-white">Manage Events</h2>

          <p className="mt-2 text-[var(--ovp-blue-100)]">
            Create, edit, archive, restore events, manage volunteers, and export
            signup lists.
          </p>
        </Link>

        {isSuperAdmin && (
          <Link
            href="/admin/users"
            className="block rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ovp-blue)]">
              Admin Users
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Manage Admins
            </h2>

            <p className="mt-3 text-slate-600">
              Review admin accounts, roles, and password status.
            </p>
          </Link>
        )}
      </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-950">
            Upcoming Events
          </h2>

          <div className="mt-5 space-y-4">
            {upcomingEvents.map((event) => {
              const signupCount = event.signups.length;
              const openSlots = Math.max(
                event.volunteerCapacity - signupCount,
                0
              );

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {event.title}
                    </p>

                    <p className="text-sm text-slate-500">
                      {event.date.toLocaleDateString("en-US")} ·{" "}
                      {event.location}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    {signupCount}/{event.volunteerCapacity} filled ·{" "}
                    {openSlots} open
                  </div>
                </div>
              );
            })}

            {upcomingEvents.length === 0 && (
              <p className="text-slate-500">
                No upcoming active events found.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}