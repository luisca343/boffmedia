"use client";

import { Button } from "@/components/ui/primitives/button";
import {
  ArrowLeft, Calendar, Clock, Users, Trophy,
  Share2, Bookmark, Server, GamepadIcon as Gamepad2,
} from "lucide-react";
import { Event } from "@boffmedia/shared";
import { EventRegistrationButton } from "../../_components/EventRegistrationButton";
import { InternalLink } from "@/components/ui/navigation/Link";
import { EventStatusChip } from "@/features/boffmedia/event/EventStatusChip";
import { CountdownTimer } from "@/app/(boffmedia)/_components/ui/CountdownTimer";
import { BoffCard } from "@/features/boffmedia/BoffCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (ds: string) =>
  new Date(ds).toLocaleDateString("es-ES", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const TYPE_ICONS: Record<string, React.ElementType> = {
  [Event.type.EVENT]: Trophy,
  [Event.type.SERVER]: Server,
};

const getTypeIcon = (type: string) => TYPE_ICONS[type] ?? Calendar;

// ─── Meta item ───────────────────────────────────────────────────────────────

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "rgba(249,115,22,0.7)" }} />
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-surface-600">{label}</div>
        <div className="text-sm font-semibold text-surface-200">{value}</div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface EventHeroProps {
  event: any;
  participants: any[];
}

export function EventHero({ event, participants }: EventHeroProps) {
  const TypeIcon = getTypeIcon(event.type);

  return (
    <>
      {/* Back navigation */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-surface-200 hover:text-surface-50"
          style={{
            background: "rgba(30,41,59,0.7)",
            borderColor: "rgba(71,85,105,0.55)",
          }}
          asChild
        >
          <InternalLink href="/eventos">
            <ArrowLeft className="w-4 h-4" />
            Volver a eventos
          </InternalLink>
        </Button>
      </div>

      {/* Hero card */}
      <BoffCard variant="primary" className="mb-8" contentClassName="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* ── Info column ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Icon + status */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.22)",
                }}
              >
                {event.icon ? (
                  <img src={event.icon} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <TypeIcon className="w-8 h-8" style={{ color: "rgb(251,146,60)" }} />
                )}
              </div>
              <div className="space-y-1.5">
                <EventStatusChip status={event.status} />
                {event.status === Event.status.UPCOMING && (
                  <div className="text-xs font-mono text-secondary-400/70">
                    <CountdownTimer
                      targetDate={event.startDate}
                      liveLabel="¡En vivo ahora!"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-3xl sm:text-4xl font-black text-surface-50 leading-tight mb-3"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {event.title}
              </h1>
              <p className="text-surface-400 leading-relaxed">{event.description}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4">
              <MetaItem icon={Clock} label="Inicia" value={formatDate(event.startDate)} />
              {event.endDate && (
                <MetaItem icon={Calendar} label="Finaliza" value={formatDate(event.endDate)} />
              )}
              <MetaItem icon={Users} label="Participantes" value={participants.length} />
              <MetaItem
                icon={Gamepad2}
                label="Juego"
                value={event.gameName ?? `Juego #${event.gameId}`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <EventRegistrationButton event={event} />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                style={{ borderColor: "rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.8)" }}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              <Button
                variant="outline"
                size="sm"
                style={{ borderColor: "rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.8)" }}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ── Visual column ────────────────────────────────────────────── */}
          <div className="flex items-center justify-center relative">
            {event.banner ? (
              <img
                src={event.banner}
                alt={event.title}
                className="w-full rounded-xl border"
                style={{ borderColor: "rgba(249,115,22,0.15)" }}
              />
            ) : (
              <div
                className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-4 border"
                style={{
                  background: "rgba(249,115,22,0.05)",
                  borderColor: "rgba(249,115,22,0.15)",
                }}
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.25)",
                    filter: "drop-shadow(0 0 16px rgba(249,115,22,0.2))",
                  }}
                >
                  <TypeIcon className="w-12 h-12" style={{ color: "rgb(251,146,60)" }} />
                </div>
                <p className="text-xs font-mono text-surface-600 uppercase tracking-widest">
                  ¡Evento Increíble!
                </p>
              </div>
            )}
          </div>
        </div>
      </BoffCard>
    </>
  );
}
