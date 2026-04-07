"use client";

import { Trophy, Crown, Medal } from "lucide-react";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

const yellow    = BOFF_VARIANTS.yellow;
const secondary = BOFF_VARIANTS.secondary;
const accent    = BOFF_VARIANTS.accent;

interface WinnersTabProps {
  previousWinners: string[];
}

const RANK_STYLES = [
  {
    icon:        Crown,
    label:       "#1",
    bg:          "linear-gradient(135deg, rgba(250,204,21,0.85), rgba(234,179,8,0.7))",
    color:       "rgba(12,9,1,0.95)",
    border:      yellow.border,
    rowBg:       "rgba(250,204,21,0.07)",
    nameColor:   yellow.text,
    badgeColor:  yellow.text,
    badgeBorder: yellow.border,
  },
  {
    icon:        Medal,
    label:       "#2",
    bg:          "linear-gradient(135deg, rgba(148,163,184,0.8), rgba(100,116,139,0.65))",
    color:       "rgba(255,255,255,0.9)",
    border:      "rgba(148,163,184,0.35)",
    rowBg:       "rgba(148,163,184,0.05)",
    nameColor:   "rgb(203,213,225)",
    badgeColor:  "rgb(148,163,184)",
    badgeBorder: "rgba(148,163,184,0.35)",
  },
  {
    icon:        Medal,
    label:       "#3",
    bg:          "linear-gradient(135deg, rgba(180,120,60,0.8), rgba(140,90,40,0.65))",
    color:       "rgba(255,255,255,0.9)",
    border:      "rgba(180,120,60,0.35)",
    rowBg:       "rgba(180,120,60,0.05)",
    nameColor:   "rgb(217,171,100)",
    badgeColor:  "rgb(180,120,60)",
    badgeBorder: "rgba(180,120,60,0.35)",
  },
];

export function WinnersTab({ previousWinners }: WinnersTabProps) {
  return (
    <>
      {/* Count strip */}
      <div className="mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded border font-bold"
          style={{
            background: "rgba(250,204,21,0.1)",
            color: yellow.text,
            borderColor: yellow.border,
            fontFamily: "Orbitron, sans-serif",
            fontSize: "10px",
          }}
        >
          {previousWinners.length} ganador{previousWinners.length !== 1 ? "es" : ""}
        </span>
      </div>

      {previousWinners.length > 0 ? (
        <div className="space-y-1.5">
          {previousWinners.map((name, index) => {
            const rank  = index < 3 ? RANK_STYLES[index] : null;
            const Icon  = rank ? rank.icon : Trophy;
            const label = rank ? rank.label : `#${index + 1}`;

            return (
              <div
                key={`${name}-${index}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200"
                style={{
                  background:  rank ? rank.rowBg : "rgba(250,204,21,0.03)",
                  borderColor: rank ? rank.border : "rgba(250,204,21,0.15)",
                }}
              >
                {/* Rank icon badge */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: rank
                      ? rank.bg
                      : "linear-gradient(135deg, rgba(250,204,21,0.4), rgba(234,179,8,0.3))",
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: rank ? rank.color : "rgba(250,204,21,0.9)" }}
                  />
                </div>

                {/* Name */}
                <span
                  className="font-semibold text-sm flex-1 truncate"
                  style={{ color: rank ? rank.nameColor : "rgb(161,127,41)" }}
                >
                  {name}
                </span>

                {/* Rank label */}
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded border tabular-nums flex-shrink-0"
                  style={{
                    color:       rank ? rank.badgeColor : "rgb(161,127,41)",
                    borderColor: rank ? rank.badgeBorder : "rgba(250,204,21,0.2)",
                    background:  "transparent",
                    fontFamily:  "Orbitron, sans-serif",
                  }}
                >
                  {label}
                </span>
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
            <Trophy className="w-7 h-7 text-surface-500" />
          </div>
          <p className="text-surface-400 mb-1 text-sm">Sin ganadores aún</p>
          <p className="text-xs text-surface-500">Los ganadores aparecerán aquí después de cada sorteo</p>
        </div>
      )}
    </>
  );
}
