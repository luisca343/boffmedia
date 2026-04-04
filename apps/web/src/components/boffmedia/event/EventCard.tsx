import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { Button } from "@/components/ui/primitives/button";
import { Event } from "@boffmedia/shared";

interface EventCardProps {
  event: Event;
  href?: string;
  className?: string;
}

const STATUS_CONFIG: Record<Event.status, { label: string; color: string; border: string; dot?: boolean }> = {
  [Event.status.ACTIVE]: {
    label: "En Vivo",
    color: "rgba(74,222,128,0.9)",
    border: "rgba(34,197,94,0.3)",
    dot: true,
  },
  [Event.status.UPCOMING]: {
    label: "Próximamente",
    color: "rgba(129,140,248,0.9)",
    border: "rgba(99,102,241,0.3)",
  },
  [Event.status.COMPLETED]: {
    label: "Finalizado",
    color: "rgba(100,116,139,0.8)",
    border: "rgba(71,85,105,0.35)",
  },
};

export function EventCard({ event, href, className = "" }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const status = STATUS_CONFIG[event.status] ?? {
    label: "Desconocido",
    color: "rgba(100,116,139,0.8)",
    border: "rgba(71,85,105,0.35)",
  };

  const isActive = event.status === Event.status.ACTIVE;

  return (
    <InternalLink href={href || `/eventos/${event.id}`} className="block group">
      <div
        className={`relative flex flex-col min-h-[300px] rounded-xl overflow-hidden border transition-all duration-200 hover:scale-[1.015] ${className}`}
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,13,27,0.99))",
          borderColor: isActive ? "rgba(34,197,94,0.22)" : "rgba(249,115,22,0.15)",
          boxShadow: isActive
            ? "0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.06)"
            : "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top neon bar */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{
            background: isActive
              ? "linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)"
              : "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)",
          }}
        />

        <div className="flex flex-col flex-1 p-5 gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: isActive ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.08)",
                border: `1px solid ${isActive ? "rgba(34,197,94,0.25)" : "rgba(249,115,22,0.2)"}`,
              }}
            >
              <Calendar
                className="w-4.5 h-4.5"
                style={{ color: isActive ? "rgba(74,222,128,0.9)" : "rgb(251,146,60)" }}
              />
            </div>

            {/* Status chip */}
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest flex-shrink-0"
              style={{
                color: status.color,
                border: `1px solid ${status.border}`,
                background: `${status.color.replace("0.9", "0.08").replace("0.8", "0.06")}`,
              }}
            >
              {status.dot && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: status.color }}
                />
              )}
              {status.label}
            </span>
          </div>

          {/* Title */}
          <div>
            <h4
              className="text-base font-black text-surface-100 leading-snug mb-1.5 transition-colors duration-150 group-hover:text-primary-200 line-clamp-2"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {event.title}
            </h4>
            <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-surface-500 font-mono">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(249,115,22,0.55)" }} />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(249,115,22,0.55)" }} />
              <span className="truncate">{event.gameName}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-1">
            <Button
              variant={isActive ? "accent" : "outline"}
              size="sm"
              className="w-full group/btn"
              style={
                !isActive
                  ? {
                      borderColor: "rgba(249,115,22,0.22)",
                      color: "rgb(251,146,60)",
                    }
                  : undefined
              }
            >
              {isActive ? "Unirse al Evento" : "Ver Evento"}
              <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </InternalLink>
  );
}
