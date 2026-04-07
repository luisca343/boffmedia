"use client";

import { useState } from "react";
import { Users, Minus, Trophy, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { BoffContainer } from "@/components/boffmedia/tools/BoffContainer";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

interface ParticipantsListProps {
  participants: string[];
  previousWinners: string[];
  onRemove: (name: string) => void;
}

const primary = BOFF_VARIANTS.primary;
const yellow = BOFF_VARIANTS.yellow;

export function ParticipantsList({
  participants,
  previousWinners,
  onRemove,
}: ParticipantsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "winners">("participants");

  const filteredParticipants = participants
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <BoffContainer variant="primary" className="h-full" contentClassName="p-6 flex flex-col">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {activeTab === "participants"
            ? <Users className="w-4 h-4" style={{ color: primary.text }} />
            : <Trophy className="w-4 h-4" style={{ color: yellow.text }} />
          }
          <span
            className="text-xs font-bold tracking-[0.35em] uppercase"
            style={{
              color: activeTab === "participants" ? primary.text : yellow.text,
              fontFamily: "Orbitron, sans-serif",
            }}
          >
            // {activeTab === "participants" ? "Participantes" : "Ganadores"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={() => setActiveTab("participants")}
            variant={activeTab === "participants" ? "default" : "ghost"}
            size="icon"
            title="Ver participantes"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setActiveTab("winners")}
            variant={activeTab === "winners" ? "default" : "ghost"}
            size="icon"
            title="Ver ganadores previos"
          >
            <Trophy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-500" />
        <Input
          placeholder={activeTab === "participants" ? "Buscar participantes..." : "Buscar ganadores..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-surface-800/60 border-surface-700/50 text-surface-50 placeholder:text-surface-500"
        />
        {searchTerm && (
          <Button
            onClick={() => setSearchTerm("")}
            variant="ghost"
            size="zero"
            className="absolute right-3 top-2.5 text-surface-500 hover:text-surface-50"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "participants" ? (
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
        ) : (
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
        )}
      </div>
    </BoffContainer>
  );
}
