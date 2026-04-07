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
