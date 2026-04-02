"use client";

import { SkyFormData } from "../store";
import {
  QuestConfigurationSection,
  LocationSection,
  PokemonSection,
  RewardSection,
  SettingsSection,
  GenerateButton,
} from "./";

// Neon secondary (cyan) static values — mirrors getNeonStyle("secondary")
const NEON = {
  bar: "from-secondary-400 via-cyan-400 to-secondary-600",
  border: "rgba(6,182,212,0.35)",
  glow: "rgba(6,182,212,0.08)",
  bracketColor: "rgba(6,182,212,0.25)",
};

const CORNER_BRACKETS = [
  "absolute top-3 left-3 w-5 h-5 border-t border-l",
  "absolute top-3 right-3 w-5 h-5 border-t border-r",
  "absolute bottom-3 left-3 w-5 h-5 border-b border-l",
  "absolute bottom-3 right-3 w-5 h-5 border-b border-r",
] as const;

interface SkyFormProps {
  formData: SkyFormData;
  onQuestTypeChange: (value: string) => void;
  onSubQuestChange: (value: string) => void;
  onFieldChange: (field: string) => (value: string | number) => void;
  onItemChange: (field: "targetItem" | "rewardItem") => (value: string) => void;
  onEuropeanVersionChange: (value: boolean) => void;
  onGenerateWonderMail: () => void;
}

export function SkyForm({
  formData,
  onQuestTypeChange,
  onSubQuestChange,
  onFieldChange,
  onItemChange,
  onEuropeanVersionChange,
  onGenerateWonderMail,
}: SkyFormProps) {
  return (
    <div
      className="relative border backdrop-blur-md rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
        borderColor: NEON.border,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${NEON.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Top neon bar */}
      <div className={`h-[3px] bg-gradient-to-r ${NEON.bar}`} style={{ opacity: 0.85 }} />

      {/* Ambient inner tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 55%)`,
        }}
      />

      {/* Corner brackets */}
      {CORNER_BRACKETS.map((cls, i) => (
        <div
          key={i}
          className={`${cls} pointer-events-none`}
          style={{ borderColor: NEON.bracketColor }}
        />
      ))}

      {/* Form content */}
      <div className="relative z-10 p-6 sm:p-8">
        <QuestConfigurationSection
          questType={formData.questType}
          specialQuestType={formData.specialQuestType}
          onQuestTypeChange={onQuestTypeChange}
          onSubQuestChange={onSubQuestChange}
        />

        <LocationSection
          dungeon={formData.dungeon}
          floor={formData.floor}
          onDungeonChange={(value) => onFieldChange("dungeon")(value)}
          onFloorChange={(value) => onFieldChange("floor")(value)}
        />

        <PokemonSection
          questType={formData.questType}
          specialQuestType={formData.specialQuestType}
          clientPokemon={formData.clientPokemon}
          targetPokemon={formData.targetPokemon}
          clientSprite={formData.clientSprite}
          targetSprite={formData.targetSprite}
          onClientPokemonChange={(value) => onFieldChange("clientPokemon")(value)}
          onTargetPokemonChange={(value) => onFieldChange("targetPokemon")(value)}
        />

        <RewardSection
          questType={formData.questType}
          rewardType={formData.rewardType}
          targetItem={formData.targetItem}
          rewardItem={formData.rewardItem}
          onRewardTypeChange={(value) => onFieldChange("rewardType")(value)}
          onTargetItemChange={onItemChange("targetItem")}
          onRewardItemChange={onItemChange("rewardItem")}
        />

        <SettingsSection
          europeanVersion={formData.europeanVersion}
          onEuropeanVersionChange={onEuropeanVersionChange}
        />

        <GenerateButton onClick={onGenerateWonderMail} />
      </div>

      {/* Bottom accent line */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)`,
        }}
      />
    </div>
  );
}
