"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";
import { EventList } from "@/components/EventList";
import type { EventItem } from "@/types/event";
import { CalendarView } from "@/components/CalendarView";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import Image from "next/image";

export default function Home() {
  const { events, isLoading, error } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 5, 1));

  const eventCount = useMemo(() => events.length, [events]);

  const changeMonth = (direction: number) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + direction,
        1
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3">
                <Image
                  src="/weke-logo.png"
                  alt="Weke Logo"
                  width={180}
                  height={60}
                  priority
                />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Events & Volunteer Calendar
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                View upcoming events, review event details, and submit
                your volunteer request.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <Link
                href="/admin/login"
                className="mb-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Admin Login
              </Link>

              <div className="rounded-2xl bg-[var(--ovp-blue)] p-4 text-white">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-medium text-[var(--ovp-blue-100)]">
                      Upcoming Events
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {eventCount} events
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            Loading events...
          </div>
        )}

        {error && (
          <div className="rounded-3xl bg-red-50 p-6 text-red-900 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <main className="space-y-8">
            <CalendarView
              events={events}
              selectedMonth={selectedMonth}
              onChangeMonth={changeMonth}
              onSelectEvent={setSelectedEvent}
            />

            <EventList
              events={events}
              selectedMonth={selectedMonth}
              onSelectEvent={setSelectedEvent}
            />
          </main>
        )}

        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    </div>
  );
}