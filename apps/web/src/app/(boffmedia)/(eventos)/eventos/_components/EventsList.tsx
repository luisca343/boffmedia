import { EventCard } from "./EventCard";
import type { Event } from "@boffmedia/shared";

export function EventsList({ events }: any) {
  return (
    <div className="space-y-4">
      {events.map((event: any) => (
        <EventCard key={event.id} event={event} layout="list" />
      ))}
    </div>
  );
}