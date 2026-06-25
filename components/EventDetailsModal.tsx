"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import type { EventItem } from "@/types/event";
import { locationOrDepartmentOptions } from "@/lib/locations";

type EventDetailsModalProps = {
  event: EventItem;
  onClose: () => void;
};

type Message = {
  type: "success" | "error";
  text: string;
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

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getEventVolunteerDateOptions(event: EventItem) {
  const startKey = event.date.slice(0, 10);
  const endKey = event.endDate ? event.endDate.slice(0, 10) : startKey;

  const startDate = new Date(`${startKey}T12:00:00`);
  const endDate = new Date(`${endKey}T12:00:00`);

  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  locationOrDepartment: "",
});

const volunteerDateOptions = getEventVolunteerDateOptions(event);

const [selectedDates, setSelectedDates] = useState<string[]>(
  volunteerDateOptions.length === 1
    ? [volunteerDateOptions[0]]
    : []
);
  const [message, setMessage] = useState<Message | null>(null);

  const spotsTaken = event.volunteers?.length ?? 0;
  const isFull = spotsTaken >= event.volunteerCapacity;

  async function handleSignup() {
  setMessage(null);

  if (isFull) {
    setMessage({
      type: "error",
      text: "This event is currently full for volunteers.",
    });
    return;
  }

  if (!formData.fullName.trim() || !formData.locationOrDepartment.trim()) {
    setMessage({
      type: "error",
      text: "Please enter your name and location or department.",
    });
    return;
  }

  if (selectedDates.length === 0) {
  setMessage({
    type: "error",
    text: "Please select at least one day you can volunteer.",
  });
  return;
}

  const response = await fetch("/api/volunteer-signups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: event.id,
      fullName: formData.fullName,
      email: formData.email,
      locationOrDepartment: formData.locationOrDepartment,
      selectedDates,
    }),
  });

  if (!response.ok) {
    const data = await response.json();

    setMessage({
      type: "error",
      text: data.error || "Unable to submit volunteer request.",
    });

    return;
  }

  setMessage({
    type: "success",
    text: "Your volunteer request has been submitted.",
  });

  setFormData({
    fullName: "",
    email: "",
    locationOrDepartment: "",
  });
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--ovp-blue)]">
              Event Details
            </p>

            <h2 className="text-2xl font-bold text-slate-950">
              {event.title}
            </h2>

            <p className="mt-1 text-slate-500">{formatDate(event.date)}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Clock className="mb-2 h-5 w-5 text-[var(--ovp-blue)]" />
            <p className="text-sm font-semibold">Time</p>
            <p className="text-sm text-slate-600">
              {event.startTime} - {event.endTime}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <MapPin className="mb-2 h-5 w-5 text-[var(--ovp-blue)]" />
            <p className="text-sm font-semibold">Location</p>
            <p className="text-sm text-slate-600">{event.location}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <Users className="mb-2 h-5 w-5 text-[var(--ovp-blue)]" />
            <p className="text-sm font-semibold">Volunteers</p>
            <p className="text-sm text-slate-600">
              {spotsTaken}/{event.volunteerCapacity} filled
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <Building2 className="mb-2 h-5 w-5 text-[var(--ovp-blue)]" />

            <p className="text-sm font-semibold">Event Contact</p>

            {event.adminAssignments &&
            event.adminAssignments.length > 0 ? (
              <div className="space-y-3">
                {event.adminAssignments.map((assignment, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-slate-900">
                      {assignment.admin.fullName || assignment.admin.email}
                    </p>

                    <p className="break-words text-sm text-slate-600">
                      {assignment.admin.email}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-900">
                  {event.createdByAdmin?.fullName || "Not assigned"}
                </p>

                {event.createdByAdmin?.email && (
                  <p className="break-words text-sm text-slate-600">
                    {event.createdByAdmin.email}
                  </p>
                )}
              </>
            )}
          </div>

        </div>

        <p className="mb-6 leading-7 text-slate-700">{event.description}</p>

        {isFull ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Volunteer slots are full</p>
                <p className="text-sm">
                  This event is currently full for volunteers. Please check
                  another event.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-4 font-bold text-slate-950">
              Request to Volunteer
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Full name
                </span>

                <input
                  value={formData.fullName}
                  onChange={(inputEvent) =>
                    setFormData({
                      ...formData,
                      fullName: inputEvent.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter your name"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  company email
                </span>

                <input
                  type="email"
                  value={formData.email}
                  onChange={(inputEvent) =>
                    setFormData({
                      ...formData,
                      email: inputEvent.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="name@weke.com"
                  required
                />
              </label>

              <select
                value={formData.locationOrDepartment}
                onChange={(inputEvent) =>
                  setFormData({
                    ...formData,
                    locationOrDepartment: inputEvent.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              >
                <option value="">Select location or department</option>
                {locationOrDepartmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Which day(s) can you volunteer?
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {volunteerDateOptions.map((dateOption) => {
                    const isChecked = selectedDates.includes(dateOption);

                    return (
                      <label
                        key={dateOption}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(inputEvent) => {
                            if (inputEvent.target.checked) {
                              setSelectedDates([...selectedDates, dateOption]);
                            } else {
                              setSelectedDates(
                                selectedDates.filter((date) => date !== dateOption)
                              );
                            }
                          }}
                          className="h-4 w-4"
                        />

                        <span>{formatShortDate(dateOption)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>



            <button
              type="button"
              onClick={handleSignup}
              className="mt-4 w-full rounded-xl bg-[var(--ovp-blue)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--ovp-blue-dark)]"
            >
              Submit Volunteer Request
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 rounded-2xl p-4 ${
              message.type === "success"
                ? "bg-green-50 text-[var(--ovp-green)]n-900"
                : "bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5" />
              )}

              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}