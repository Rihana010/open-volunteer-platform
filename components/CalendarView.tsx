"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { EventItem } from "@/types/event";

type CalendarViewProps = {
  events: EventItem[];
  selectedMonth: Date;
  onChangeMonth: (direction: number) => void;
  onSelectEvent: (event: EventItem) => void;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  const days: (Date | null)[] = [];

  for (let i = 0; i < startDay; i += 1) days.push(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateKeyFromString(dateString: string) {
  return dateString.slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getEventDateKeys(event: EventItem) {
  const startKey = dateKeyFromString(event.date);
  const endKey = event.endDate ? dateKeyFromString(event.endDate) : startKey;

  const startDate = new Date(`${startKey}T12:00:00`);
  const endDate = new Date(`${endKey}T12:00:00`);

  const keys: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    keys.push(currentDate.toISOString().slice(0, 10));
    currentDate = addDays(currentDate, 1);
  }

  return keys;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CalendarView({
  events,
  selectedMonth,
  onChangeMonth,
  onSelectEvent,
}: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventItem[]>([]);

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const monthDays = getMonthDays(year, month);

  const eventsByDate = events.reduce<Record<string, EventItem[]>>(
  (acc, event) => {
    const dateKeys = getEventDateKeys(event);

    dateKeys.forEach((key) => {
      acc[key] = acc[key] || [];
      acc[key].push(event);
    });

    return acc;
  },
  {}
);

  function handleDayClick(day: Date, dayEvents: EventItem[]) {
    if (dayEvents.length === 0) return;

    if (dayEvents.length === 1) {
      onSelectEvent(dayEvents[0]);
      return;
    }

    setSelectedDay(day);
    setSelectedDayEvents(dayEvents);
  }

  function closeDayModal() {
    setSelectedDay(null);
    setSelectedDayEvents([]);
  }

  return (
    <>
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {monthNames[month]} {year}
            </h2>
            <p className="text-sm text-slate-500">
              Select a day to view event details.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => onChangeMonth(1)}
              className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-28 rounded-2xl bg-slate-50"
                />
              );
            }

            const dateKey = toDateKey(day);
            const dayEvents = eventsByDate[dateKey] || [];
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleDayClick(day, dayEvents)}
                disabled={!hasEvents}
                className={`min-h-28 rounded-2xl border p-2 text-left transition ${
                  hasEvents
                    ? "border-blue-200 bg-blue-50 hover:bg-[var(--ovp-blue-100)]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const spotsTaken = event.volunteers?.length ?? 0;
                    const isFull = spotsTaken >= event.volunteerCapacity;

                    return (
                      <div
                        key={event.id}
                        className={`w-full rounded-xl px-2 py-1 text-xs font-medium ${
                          isFull
                            ? "bg-slate-200 text-slate-700"
                            : "bg-[var(--ovp-blue)] text-white"
                        }`}
                      >
                        {event.title}
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="rounded-xl bg-white px-2 py-1 text-xs font-semibold text-[var(--ovp-blue)] ring-1 ring-blue-200">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedDay && selectedDayEvents.length > 1 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--ovp-blue)]">
                  Events This Day
                </p>

                <h3 className="text-2xl font-bold text-slate-950">
                  {formatDayLabel(selectedDay)}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeDayModal}
                className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                aria-label="Close event list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayEvents.map((event) => {
                const spotsTaken = event.volunteers?.length ?? 0;
                const spotsRemaining = event.volunteerCapacity - spotsTaken;
                const isFull = spotsRemaining <= 0;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      closeDayModal();
                      onSelectEvent(event);
                    }}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">
                          {event.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {event.startTime} - {event.endTime}
                        </p>

                        <p className="text-sm text-slate-500">
                          {event.location}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isFull
                            ? "bg-slate-200 text-slate-700"
                            : "bg-[var(--ovp-green-100)] text-[var(--ovp-green)]n-800"
                        }`}
                      >
                        {isFull ? "Full" : `${spotsRemaining} open`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}