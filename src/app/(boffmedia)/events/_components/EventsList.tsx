import { EventCard } from "./EventCard";
import type { Event } from "@/types/events";

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} layout="list" />
      ))}
    </div>
  );
}