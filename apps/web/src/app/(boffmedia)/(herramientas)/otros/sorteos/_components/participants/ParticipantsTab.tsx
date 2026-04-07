"use client";

import { Users, Minus } from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

const primary = BOFF_VARIANTS.primary;

interface ParticipantsTabProps {
  participants: string[];
  filteredParticipants: string[];
  searchTerm: string;
  onRemove: (name: string) => void;
}

export function ParticipantsTab({
  participants,
  filteredParticipants,
  searchTerm,
  onRemove,
}: ParticipantsTabProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="secondary"
          style={{
            background: "rgba(249,115,22,0.15)",
            color: primary.text,
            borderColor: primary.border,
          }}
        >
          {filteredParticipants.length} de {participants.length}
        </Badge>
        {searchTerm && (
          <Badge variant="outline" className="text-surface-400 border-surface-600">
            Filtrado: &quot;{searchTerm}&quot;
          </Badge>
        )}
      </div>

      {filteredParticipants.length > 0 ? (
        <div className="space-y-2">
          {filteredParticipants.map((name, index) => (
            <div
              key={name}
              className="group flex items-center justify-between p-3 rounded-lg border transition-all duration-200"
              style={{
                background: "rgba(30,41,59,0.5)",
                borderColor: "rgba(71,85,105,0.4)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primary.text}, rgba(234,88,12,1))` }}
                >
                  {index + 1}
                </div>
                <span className="text-surface-100 font-medium text-sm truncate">{name}</span>
              </div>
              <Button
                onClick={() => onRemove(name)}
                variant="ghost"
                size="zero"
                className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                title={`Eliminar a ${name}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div className="w-14 h-14 bg-surface-800/60 rounded-lg flex items-center justify-center mb-4">
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
