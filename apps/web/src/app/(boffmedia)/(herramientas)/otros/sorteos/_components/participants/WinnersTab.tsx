"use client";

import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

const yellow = BOFF_VARIANTS.yellow;

interface WinnersTabProps {
  previousWinners: string[];
}

export function WinnersTab({ previousWinners }: WinnersTabProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="secondary"
          style={{
            background: "rgba(250,204,21,0.12)",
            color: yellow.text,
            borderColor: yellow.border,
          }}
        >
          {previousWinners.length} ganador{previousWinners.length !== 1 ? "es" : ""}
        </Badge>
      </div>

      {previousWinners.length > 0 ? (
        <div className="space-y-2">
          {previousWinners.map((name, index) => (
            <div
              key={`${name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                background: "rgba(250,204,21,0.06)",
                borderColor: yellow.border,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, rgba(250,204,21,0.8), rgba(234,179,8,0.9))` }}
              >
                <Trophy className="w-3.5 h-3.5 text-surface-900" />
              </div>
              <span className="font-medium text-sm flex-1 truncate" style={{ color: yellow.text }}>
                {name}
              </span>
              <Badge
                variant="outline"
                className="text-xs ml-auto"
                style={{ color: yellow.text, borderColor: yellow.border }}
              >
                #{index + 1}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div className="w-14 h-14 bg-surface-800/60 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7 text-surface-500" />
          </div>
          <p className="text-surface-400 mb-1 text-sm">Sin ganadores aún</p>
          <p className="text-xs text-surface-500">Los ganadores aparecerán aquí después de cada sorteo</p>
        </div>
      )}
    </>
  );
}
