"use client";

import { useState } from "react";
import { Users, Trophy, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { BoffContainer } from "@/components/boffmedia/tools/BoffContainer";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";
import { ParticipantsTab } from "./ParticipantsTab";
import { WinnersTab } from "./WinnersTab";

interface ParticipantsListProps {
  participants: string[];
  previousWinners: string[];
  onRemove: (name: string) => void;
}

const primary = BOFF_VARIANTS.primary;
const yellow  = BOFF_VARIANTS.yellow;

export function ParticipantsList({ participants, previousWinners, onRemove }: ParticipantsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab]   = useState<"participants" | "winners">("participants");

  const filteredParticipants = participants
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const activeBoff = activeTab === "participants" ? primary : yellow;

  return (
    <BoffContainer variant={activeTab === "participants" ? "primary" : "yellow"} className="h-full flex flex-col" contentClassName="p-5 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {activeTab === "participants"
            ? <Users className="w-4 h-4 flex-shrink-0" style={{ color: primary.text }} />
            : <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: yellow.text }} />
          }
          <span
            className="text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: activeBoff.text, fontFamily: "Orbitron, sans-serif" }}
          >
            // {activeTab === "participants" ? "Participantes" : "Ganadores"}
          </span>
        </div>

        {/* Tab buttons */}
        <div
          className="flex gap-0.5 p-0.5 rounded-lg"
          style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(71,85,105,0.3)" }}
        >
          <button
            onClick={() => setActiveTab("participants")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
            style={{
              background: activeTab === "participants" ? "rgba(249,115,22,0.15)" : "transparent",
              color: activeTab === "participants" ? primary.text : "rgb(100,116,139)",
              border: activeTab === "participants" ? `1px solid ${primary.border}` : "1px solid transparent",
            }}
            title="Ver participantes"
          >
            <Users className="w-3.5 h-3.5" />
            <span
              className="hidden sm:inline"
              style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", letterSpacing: "0.1em" }}
            >
              {participants.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("winners")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
            style={{
              background: activeTab === "winners" ? "rgba(250,204,21,0.12)" : "transparent",
              color: activeTab === "winners" ? yellow.text : "rgb(100,116,139)",
              border: activeTab === "winners" ? `1px solid ${yellow.border}` : "1px solid transparent",
            }}
            title="Ver ganadores previos"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span
              className="hidden sm:inline"
              style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", letterSpacing: "0.1em" }}
            >
              {previousWinners.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-500 pointer-events-none" />
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

      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === "participants" ? (
          <ParticipantsTab
            participants={participants}
            filteredParticipants={filteredParticipants}
            searchTerm={searchTerm}
            onRemove={onRemove}
          />
        ) : (
          <WinnersTab previousWinners={previousWinners} />
        )}
      </div>
    </BoffContainer>
  );
}
