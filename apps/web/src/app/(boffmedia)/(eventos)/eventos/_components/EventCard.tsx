"use client";

import {
  Calendar, Clock, Trophy, Server, Star, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { useGetGames } from "@/hooks/events/useGetGames";
import { cn } from "@/lib/utils";
import { getEventStatus } from "@/lib/events";
import { Event } from "@boffmedia/shared";
import { InternalLink } from "@/components/ui/navigation/Link";
import { EventStatusChip } from "@/components/boffmedia/event/EventStatusChip";
import { BoffCard } from "@/components/boffmedia/BoffCard";

// ─── Type icon map ────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  [Event.type.EVENT]: Trophy,
  [Event.type.SERVER]: Server,
};
const getTypeIcon = (type: string) => TYPE_ICONS[type] ?? Calendar;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (ds: string) =>
  new Date(ds).toLocaleDateString("es-ES", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const getTimeUntil = (ds: string): string | null => {
  const diff = new Date(ds).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `En ${days}d`;
  if (hours > 0) return `En ${hours}h`;
  return "Muy pronto";
};

// ─── Component ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event;
  layout?: "grid" | "list";
}

export function EventCard({ event, layout = "grid" }: EventCardProps) {
  const { games } = useGetGames();
  const game = games?.find((g) => g.id === event.gameId);
  const status = getEventStatus(event.startDate, event.endDate);
  const timeUntil = getTimeUntil(event.startDate);
  const TypeIcon = getTypeIcon(event.type);
  const isList = layout === "list";

  return (
    <BoffCard
      variant="primary"
      className={cn("group cursor-pointer", isList && "flex-row")}
      contentClassName=""
    >
      {/* ── Banner / visual ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex-shrink-0 overflow-hidden",
          isList ? "w-48 md:w-56" : "h-44",
        )}
        style={{ background: "rgba(30,41,59,0.6)" }}
      >
        {event.banner ? (
          <img
            src={event.banner}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border"
              style={{
                background: "rgba(249,115,22,0.08)",
                borderColor: "rgba(249,115,22,0.22)",
              }}
            >
              <TypeIcon className="w-7 h-7" style={{ color: "rgb(251,146,60)" }} />
            </div>
          </div>
        )}

        {/* Status chip */}
        <div className="absolute top-3 right-3">
          <EventStatusChip status={event.status} />
        </div>

        {/* Countdown badge */}
        {timeUntil && status.label === "Próximo" && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest"
              style={{
                color: "rgba(34,211,238,0.9)",
                border: "1px solid rgba(6,182,212,0.3)",
                background: "rgba(6,182,212,0.08)",
              }}
            >
              {timeUntil}
            </span>
          </div>
        )}

        {/* Type icon — bottom left */}
        <div
          className="absolute bottom-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center border"
          style={{
            background: "rgba(15,23,42,0.8)",
            borderColor: "rgba(249,115,22,0.22)",
          }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: "rgb(251,146,60)" }} />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-5 gap-3 min-w-0">
        {/* Game info */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center overflow-hidden flex-shrink-0 border"
            style={{
              background: "rgba(249,115,22,0.06)",
              borderColor: "rgba(249,115,22,0.18)",
            }}
          >
            {game?.icon ? (
              <img src={game.icon} alt="" className="w-full h-full object-cover" />
            ) : (
              <Calendar className="w-3.5 h-3.5" style={{ color: "rgba(249,115,22,0.6)" }} />
            )}
          </div>
          <span className="text-[11px] font-mono text-primary-400/60 uppercase tracking-wider truncate">
            {game?.title ?? `Juego #${event.gameId}`}
          </span>
          <span className="text-[10px] text-surface-600 ml-auto flex-shrink-0">
            {event.type === Event.type.EVENT ? "Evento" : "Servidor"}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base font-black text-surface-50 leading-snug line-clamp-2 group-hover:text-primary-200 transition-colors duration-200"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-surface-500 line-clamp-3 leading-relaxed flex-1">
          {event.description}
        </p>

        {/* Dates */}
        <div className="space-y-1 text-xs font-mono text-surface-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(249,115,22,0.5)" }} />
            <span>{formatDate(event.startDate)}</span>
          </div>
          {event.endDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(249,115,22,0.5)" }} />
              <span>Hasta {formatDate(event.endDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-3 flex gap-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(71,85,105,0.25)" }}
      >
        <Button asChild variant="accent" size="sm" className="flex-1 group/btn">
          <InternalLink
            href={`/eventos/${event.id}`}
            className="flex items-center justify-center gap-1.5"
          >
            Ver detalles
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
          </InternalLink>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="px-2.5"
          style={{
            borderColor: "rgba(249,115,22,0.22)",
            color: "rgba(249,115,22,0.65)",
          }}
        >
          <Star className="w-3.5 h-3.5" />
        </Button>
      </div>
    </BoffCard>
  );
}
