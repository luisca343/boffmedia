"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Upload, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { BoffContainer } from "@/components/boffmedia/tools/BoffContainer";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

interface GiveawayControlsProps {
  onAddParticipant: (name: string) => void;
  onUploadList: (list: string[]) => void;
  onStartGiveaway: () => void;
  participantCount: number;
}

const boff = BOFF_VARIANTS.primary;

export function GiveawayControls({
  onAddParticipant,
  onUploadList,
  onStartGiveaway,
  participantCount,
}: GiveawayControlsProps) {
  const [newParticipant, setNewParticipant] = useState("");
  const [participantList, setParticipantList] = useState("");
  const [activeTab, setActiveTab] = useState("single");

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipant.trim()) {
      onAddParticipant(newParticipant.trim());
      setNewParticipant("");
    }
  };

  const handleUploadList = () => {
    const names = participantList
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
    if (names.length > 0) {
      onUploadList(names);
      setParticipantList("");
    }
  };

  return (
    <BoffContainer variant="primary" contentClassName="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-4 h-4" style={{ color: boff.text }} />
          <span
            className="text-xs font-bold tracking-[0.35em] uppercase"
            style={{ color: boff.text, fontFamily: "Orbitron, sans-serif" }}
          >
            // Configurar Sorteo
          </span>
        </div>
        <p className="text-surface-400 text-sm">
          Añade participantes individualmente o sube una lista completa
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-surface-800/60 border border-surface-700/50">
            <TabsTrigger
              value="single"
              className="data-[state=active]:text-white transition-all duration-200"
              style={{ ["--active-bg" as string]: boff.border }}
            >
              <UserPlus className="mr-2 w-4 h-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="data-[state=active]:text-white transition-all duration-200"
            >
              <Upload className="mr-2 w-4 h-4" />
              Lista Masiva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <form onSubmit={handleAddSingle} className="flex gap-3">
              <Input
                placeholder="Escribe el nombre del participante..."
                value={newParticipant}
                onChange={e => setNewParticipant(e.target.value)}
                className="bg-surface-800/60 border-surface-700/50 text-surface-50 placeholder:text-surface-500 focus:border-primary-500/50 transition-all duration-200"
              />
              <Button type="submit" variant="default">
                Añadir
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="list" className="mt-6 space-y-4">
            <Textarea
              placeholder={`Añade un nombre por línea:\n\nParticipante 1\nParticipante 2\nParticipante 3\n...`}
              value={participantList}
              onChange={e => setParticipantList(e.target.value)}
              rows={6}
              className="bg-surface-800/60 border-surface-700/50 text-surface-50 placeholder:text-surface-500 focus:border-primary-500/50 transition-all duration-200 resize-none"
            />
            <Button
              onClick={handleUploadList}
              disabled={!participantList.trim()}
              className="w-full"
              variant="default"
            >
              <Upload className="mr-2 w-4 h-4" />
              Cargar Lista ({participantList.split("\n").filter(Boolean).length} nombres)
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Warning */}
      {participantCount === 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border mb-6"
          style={{
            background: "rgba(245,158,11,0.08)",
            borderColor: "rgba(245,158,11,0.25)",
            color: "rgb(252,211,77)",
          }}
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Faltan participantes</p>
            <p className="text-sm opacity-80">
              Añade al menos un participante para poder iniciar el sorteo
            </p>
          </div>
        </div>
      )}

      {/* Status */}
      <div
        className="text-center py-6 px-4 rounded-lg border mb-8"
        style={{
          background: "rgba(30,41,59,0.6)",
          borderColor: "rgba(71,85,105,0.4)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full transition-colors duration-300"
            style={{
              background: participantCount > 0 ? boff.text : "rgb(100,116,139)",
              boxShadow: participantCount > 0 ? `0 0 8px ${boff.glowStrong}` : "none",
            }}
          />
          <p className="text-surface-300 font-medium">
            {participantCount === 0
              ? "Sin participantes"
              : `${participantCount} participante${participantCount !== 1 ? "s" : ""} listo${participantCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        {participantCount > 0 && (
          <p className="text-sm text-surface-500">
            El sorteo seleccionará aleatoriamente a uno de los participantes
          </p>
        )}
      </div>

      {/* Start Button */}
      <motion.button
        onClick={onStartGiveaway}
        disabled={participantCount === 0}
        className="w-full h-12 rounded-lg border font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          fontFamily: "Orbitron, sans-serif",
          borderColor: boff.border,
          color: boff.text,
          background: "rgba(249,115,22,0.08)",
        }}
        whileHover={participantCount > 0 ? { background: "rgba(249,115,22,0.15)", boxShadow: `0 0 20px ${boff.glowStrong}` } : {}}
        whileTap={participantCount > 0 ? { scale: 0.99 } : {}}
      >
        <Play className="w-4 h-4" />
        {participantCount === 0 ? "Añade participantes para continuar" : "Iniciar Sorteo"}
      </motion.button>
    </BoffContainer>
  );
}
