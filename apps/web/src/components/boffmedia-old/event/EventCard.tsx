import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { Button } from "@/components/ui/primitives/button";
import { Event } from "@boffmedia/shared";
import { EventStatusChip } from "./EventStatusChip";
import { BoffCard } from "@/components/boffmedia-old/BoffCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Component ───────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event;
  href?: string;
  className?: string;
}

export function EventCard({ event, href, className = "" }: EventCardProps) {
  const isActive = event.status === Event.status.ACTIVE;

  return (
    <InternalLink href={href || `/eventos/${event.id}`} className="block group">
      <BoffCard
        variant="primary"
        className={`min-h-[290px] ${className}`}
        contentClassName="p-5 gap-4"
      >
        {/* Header: icon + status */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
            style={{
              background: "rgba(249,115,22,0.07)",
              borderColor: "rgba(249,115,22,0.18)",
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: "rgb(251,146,60)" }} />
          </div>
          <EventStatusChip status={event.status} />
        </div>

        {/* Title + description */}
        <div>
          <h4
            className="text-base font-black text-ink leading-snug mb-1.5 line-clamp-2 transition-colors duration-200 group-hover:text-primary-hover"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {event.title}
          </h4>
          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-ink-muted font-mono mt-auto">
          <div className="flex items-center gap-2">
            <Calendar
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: "rgba(249,115,22,0.5)" }}
            />
            <span>{formatDate(event.startDate)}</span>
          </div>
          {event.gameName && (
            <div className="flex items-center gap-2">
              <MapPin
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "rgba(249,115,22,0.5)" }}
              />
              <span className="truncate">{event.gameName}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-1">
          <Button
            variant={isActive ? "accent" : "outline"}
            size="sm"
            className="w-full group/btn pointer-events-none"
            style={
              !isActive
                ? { borderColor: "rgba(249,115,22,0.25)", color: "rgb(251,146,60)" }
                : undefined
            }
          >
            {isActive ? "Unirse al Evento" : "Ver Evento"}
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      </BoffCard>
    </InternalLink>
  );
}
