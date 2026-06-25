"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { EventStatusBadge } from "./EventStatusBadge";
import type { EventItem } from "@/types/event";

type EventListProps = {
  events: EventItem[];
  selectedMonth: Date;
  onSelectEvent: (event: EventItem) => void;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getEventMonthKey(dateString: string) {
  const dateOnly = dateString.slice(0, 10);
  const [year, month] = dateOnly.split("-").map(Number);

  return `${year}-${month - 1}`;
}

function formatMonthHeading(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function EventList({
  events,
  selectedMonth,
  onSelectEvent,
}: EventListProps) {
  const [visibleMonthCount, setVisibleMonthCount] = useState(1);
  useEffect(() => {
  setVisibleMonthCount(1);
}, [selectedMonth]);

  const monthGroups = useMemo(() => {
    const grouped = events.reduce<Record<string, EventItem[]>>((acc, event) => {
      const key = getEventMonthKey(event.date);
      acc[key] = acc[key] || [];
      acc[key].push(event);
      return acc;
    }, {});

    return Object.entries(grouped)
      .filter(([monthKey]) => {
        const [year, month] = monthKey.split("-").map(Number);
        const monthDate = new Date(year, month, 1);
        const selectedDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        );

        return monthDate >= selectedDate;
      })
      .sort(([a], [b]) => {
        const [yearA, monthA] = a.split("-").map(Number);
        const [yearB, monthB] = b.split("-").map(Number);

        return (
          new Date(yearA, monthA, 1).getTime() -
          new Date(yearB, monthB, 1).getTime()
        );
      })
      .map(([monthKey, monthEvents]) => ({
        monthKey,
        events: monthEvents.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));
  }, [events, selectedMonth]);

  const visibleGroups = monthGroups.slice(0, visibleMonthCount);
  const hasMoreMonths = visibleMonthCount < monthGroups.length;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-950">
          Upcoming Events
        </h2>

        <p className="text-sm text-slate-500">
          Browse volunteer opportunities by month and select an event to view
          details.
        </p>
      </div>

      <div className="space-y-8">
        {visibleGroups.map((group) => (
          <div key={group.monthKey}>
            <h3 className="mb-4 text-lg font-bold text-slate-950">
              {formatMonthHeading(group.monthKey)}
            </h3>

            <div className="space-y-4">
              {group.events.map((event) => {
                const spotsTaken = event.volunteers?.length ?? 0;
                const spotsRemaining =
                  event.volunteerCapacity - spotsTaken;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-950">
                          {event.title}
                        </h4>

                        <p className="text-sm text-slate-500">
                          {formatDate(event.date)}
                        </p>
                      </div>

                      <EventStatusBadge
                        spotsRemaining={spotsRemaining}
                      />
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {event.startTime} - {event.endTime}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </p>

                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {spotsTaken}/{event.volunteerCapacity} volunteers
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {visibleGroups.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">
            No events found for this month.
          </p>
        )}
      </div>

      {hasMoreMonths && (
        <button
          type="button"
          onClick={() => setVisibleMonthCount((count) => count + 1)}
          className="mt-6 w-full rounded-xl bg-[var(--ovp-blue)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--ovp-blue-dark)]"
        >
          View More
        </button>
      )}
    </section>
  );
}