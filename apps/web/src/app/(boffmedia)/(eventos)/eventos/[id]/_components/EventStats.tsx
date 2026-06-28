"use client";

import { Users, Trophy, Server, CalendarDays } from "lucide-react";
import { Event } from "@boffmedia/shared";
import { ProfileImage } from "@/components/ui/ProfileImage";

// ─── Component ───────────────────────────────────────────────────────────────

interface EventStatsProps {
  event: any;
  participants: any[];
  achievements: any[];
}

export function EventStats({ event, participants, achievements }: EventStatsProps) {
  const isEventType = event.type === Event.type.EVENT;
  const avatarPreview = participants.slice(0, 5);
  const overflow = participants.length - avatarPreview.length;

  return (
    <div
      className="flex flex-col sm:flex-row items-stretch sm:items-center mb-8 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(100deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.6) 100%)",
        border: "1px solid rgba(71,85,105,0.22)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── Participants ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-4 px-6 py-5">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.18)" }}
        >
          <Users className="w-5 h-5" style={{ color: "rgba(249,115,22,0.8)" }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-0.5">
            Participantes
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-2xl font-black leading-none"
              style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
            >
              {participants.length}
            </span>
            {/* Avatar stack */}
            {avatarPreview.length > 0 && (
              <div className="flex items-center">
                {avatarPreview.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-full ring-2 -ml-2 first:ml-0 overflow-hidden flex-shrink-0"
                    style={{ width: 24, height: 24 }}
                  >
                    <ProfileImage userId={p.userId} size={24} />
                  </div>
                ))}
                {overflow > 0 && (
                  <span
                    className="text-[10px] font-mono text-ink-muted ml-2"
                  >
                    +{overflow}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div
        className="hidden sm:block w-px self-stretch"
        style={{ background: "rgba(71,85,105,0.25)" }}
      />
      <div
        className="sm:hidden h-px mx-6"
        style={{ background: "rgba(71,85,105,0.25)" }}
      />

      {/* ── Achievements ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-4 px-6 py-5">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.18)" }}
        >
          <Trophy className="w-5 h-5" style={{ color: "rgba(250,204,21,0.8)" }} />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-0.5">
            Logros
          </div>
          <span
            className="text-2xl font-black leading-none"
            style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
          >
            {achievements.length}
          </span>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div
        className="hidden sm:block w-px self-stretch"
        style={{ background: "rgba(71,85,105,0.25)" }}
      />
      <div
        className="sm:hidden h-px mx-6"
        style={{ background: "rgba(71,85,105,0.25)" }}
      />

      {/* ── Event type ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-4 px-6 py-5">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}
        >
          {isEventType
            ? <CalendarDays className="w-5 h-5" style={{ color: "rgba(99,102,241,0.85)" }} />
            : <Server className="w-5 h-5" style={{ color: "rgba(99,102,241,0.85)" }} />
          }
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-0.5">
            Modalidad
          </div>
          <span
            className="text-base font-bold leading-none"
            style={{ color: "rgb(226,232,240)" }}
          >
            {isEventType ? "Evento" : "Servidor"}
          </span>
        </div>
      </div>
    </div>
  );
}
