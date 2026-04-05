"use client";

import { Users, Trophy, Target } from "lucide-react";
import { Event } from "@boffmedia/shared";

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: string | number;
  accentColor: string;   // rgba text / dot
  borderColor: string;   // rgba border
  barColor: string;      // top bar gradient stop
}

function StatCard({ icon: Icon, label, sublabel, value, accentColor, borderColor, barColor }: StatCardProps) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border"
      style={{
        background: "linear-gradient(145deg, rgba(9,13,27,0.97), rgba(15,23,42,0.95))",
        borderColor,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${barColor}, transparent)`,
        }}
      />

      <div className="p-5">
        {/* Label row */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor.replace("0.9", "0.09")}`, border: `1px solid ${borderColor}` }}
          >
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {label}
          </span>
        </div>

        {/* Value */}
        <div
          className="text-4xl font-black leading-none mb-1"
          style={{ color: accentColor, fontFamily: "Orbitron, sans-serif" }}
        >
          {value}
        </div>
        <p className="text-xs text-surface-600 font-mono">{sublabel}</p>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface EventStatsProps {
  event: any;
  participants: any[];
  achievements: any[];
}

export function EventStats({ event, participants, achievements }: EventStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <StatCard
        icon={Users}
        label="Participantes"
        sublabel="Aventureros registrados"
        value={participants.length}
        accentColor="rgba(99,102,241,0.9)"
        borderColor="rgba(99,102,241,0.2)"
        barColor="rgba(99,102,241,0.55)"
      />
      <StatCard
        icon={Trophy}
        label="Logros"
        sublabel="Conquistas disponibles"
        value={achievements.length}
        accentColor="rgba(234,179,8,0.9)"
        borderColor="rgba(234,179,8,0.2)"
        barColor="rgba(234,179,8,0.55)"
      />
      <StatCard
        icon={Target}
        label="Tipo"
        sublabel="Modalidad de juego"
        value={event.type === Event.type.EVENT ? "Evento" : "Servidor"}
        accentColor="rgba(249,115,22,0.9)"
        borderColor="rgba(249,115,22,0.2)"
        barColor="rgba(249,115,22,0.55)"
      />
    </div>
  );
}
