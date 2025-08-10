import { Event } from "@/generated/api";
import { EventCard } from "./EventCard";

export function EventsGrid({ events }: { events: Event[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event: Event, index: number) => (
        <div 
          key={event.id}
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
          className="opacity-0"
        >
          <EventCard event={event} layout="grid" />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}