"use client";

import { Users, Minus } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

const primary = BOFF_VARIANTS.primary;

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  const hues = [210, 265, 145, 185, 320, 45, 25, 290];
  return hues[hash % hues.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface ParticipantsTabProps {
  participants: string[];
  filteredParticipants: string[];
  searchTerm: string;
  onRemove: (name: string) => void;
}

export function ParticipantsTab({ participants, filteredParticipants, searchTerm, onRemove }: ParticipantsTabProps) {
  return (
    <>
      {/* Count strip */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded border font-bold"
          style={{
            background: "rgba(249,115,22,0.1)",
            color: primary.text,
            borderColor: primary.border,
            fontFamily: "Orbitron, sans-serif",
            fontSize: "10px",
          }}
        >
          {filteredParticipants.length}/{participants.length}
        </span>
        {searchTerm && (
          <span className="text-[10px] text-surface-500 truncate">
            &quot;{searchTerm}&quot;
          </span>
        )}
      </div>

      {filteredParticipants.length > 0 ? (
        <div className="space-y-1.5">
          {filteredParticipants.map((name, index) => {
            const hue      = nameToHue(name);
            const initials = getInitials(name);
            return (
              <div
                key={name}
                className="group flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200"
                style={{
                  background: "rgba(15,23,42,0.5)",
                  borderColor: "rgba(71,85,105,0.35)",
                }}
              >
                {/* Initials avatar */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black select-none"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue}, 55%, 32%), hsl(${hue}, 45%, 20%))`,
                    color: `hsl(${hue}, 80%, 90%)`,
                    fontFamily: "Orbitron, sans-serif",
                  }}
                >
                  {initials}
                </div>

                {/* Name + position */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-surface-100 font-medium text-sm truncate">{name}</span>
                </div>

                {/* Position badge */}
                <span
                  className="text-[9px] font-black opacity-0 group-hover:opacity-0 flex-shrink-0 tabular-nums"
                  style={{ color: "rgb(71,85,105)", fontFamily: "Orbitron, sans-serif" }}
                >
                  #{index + 1}
                </span>

                {/* Remove */}
                <Button
                  onClick={() => onRemove(name)}
                  variant="ghost"
                  size="zero"
                  className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 flex-shrink-0"
                  title={`Eliminar a ${name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
            style={{ background: "rgba(30,41,59,0.6)" }}
          >
            <Users className="w-7 h-7 text-surface-500" />
          </div>
          {searchTerm ? (
            <>
              <p className="text-surface-400 mb-1 text-sm">No se encontraron participantes</p>
              <p className="text-xs text-surface-500">que coincidan con &quot;{searchTerm}&quot;</p>
            </>
          ) : (
            <>
              <p className="text-surface-400 mb-1 text-sm">Sin participantes</p>
              <p className="text-xs text-surface-500">Añade participantes para comenzar</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
