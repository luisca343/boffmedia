"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Upload, Zap, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { BoffContainer } from "@/components/boffmedia-old/tools/BoffContainer";
import { BOFF_VARIANTS } from "@/components/boffmedia-old/tools/utils/boffVariants";

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
    const names = participantList.split("\n").map(l => l.trim()).filter(Boolean);
    if (names.length > 0) {
      onUploadList(names);
      setParticipantList("");
    }
  };

  const isReady = participantCount > 0;
  const bulkCount = participantList.split("\n").filter(l => l.trim()).length;

  return (
    <BoffContainer variant="primary" className="h-full" contentClassName="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
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
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-surface-800/60 border border-surface-700/50">
            <TabsTrigger
              value="single"
              className="data-[state=active]:text-white transition-all duration-200"
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
              Cargar Lista ({bulkCount} nombre{bulkCount !== 1 ? "s" : ""})
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Warning / Ready state */}
      {!isReady ? (
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
            <p className="font-medium mb-1 text-sm">Faltan participantes</p>
            <p className="text-xs opacity-75">
              Añade al menos un participante para poder iniciar el sorteo
            </p>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg border mb-6"
          style={{
            background: "rgba(249,115,22,0.06)",
            borderColor: boff.border,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{ background: boff.text, boxShadow: `0 0 8px ${boff.glowStrong}` }}
            />
            <Users className="w-4 h-4" style={{ color: boff.text }} />
            <span className="text-surface-300 text-sm font-medium">
              {participantCount} participante{participantCount !== 1 ? "s" : ""} listo{participantCount !== 1 ? "s" : ""}
            </span>
          </div>
          <span
            className="text-2xl font-black tabular-nums"
            style={{ color: boff.text, fontFamily: "Orbitron, sans-serif" }}
          >
            {participantCount}
          </span>
        </div>
      )}

      {/* Launch button */}
      <motion.button
        onClick={onStartGiveaway}
        disabled={!isReady}
        className="relative w-full h-16 rounded-lg font-black text-sm tracking-[0.3em] uppercase flex items-center justify-center gap-3 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          fontFamily: "Orbitron, sans-serif",
          border: `1px solid ${isReady ? boff.border : "rgba(71,85,105,0.4)"}`,
          color: isReady ? "white" : "rgb(100,116,139)",
          background: isReady
            ? "linear-gradient(135deg, rgba(249,115,22,0.85) 0%, rgba(234,88,12,0.9) 50%, rgba(194,65,12,0.85) 100%)"
            : "rgba(15,23,42,0.6)",
          boxShadow: isReady
            ? `0 4px 24px ${boff.glowStrong}, 0 0 60px ${boff.glow}`
            : "none",
        }}
        whileHover={isReady ? { scale: 1.005, boxShadow: `0 4px 32px rgba(249,115,22,0.5), 0 0 80px rgba(249,115,22,0.2)` } : {}}
        whileTap={isReady ? { scale: 0.98 } : {}}
      >
        {/* Shine sweep */}
        {isReady && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
          />
        )}
        <Zap className="w-5 h-5 flex-shrink-0" />
        {isReady ? "Iniciar Sorteo" : "Añade participantes para continuar"}
        {isReady && <Zap className="w-5 h-5 flex-shrink-0" />}
      </motion.button>
    </BoffContainer>
  );
}
