"use client";

import { useEffect, useState } from "react";
import type { EventItem } from "@/types/event";

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        setEvents(data);
      } catch {
        setError("Unable to load events.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return { events, isLoading, error };
}