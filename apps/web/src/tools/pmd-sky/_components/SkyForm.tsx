"use client";

import { BoffContainer } from "@/features/boffmedia/tools/BoffContainer";
import { SkyFormData } from "../store";
import {
  QuestConfigurationSection,
  LocationSection,
  PokemonSection,
  RewardSection,
  SettingsSection,
  GenerateButton,
} from "./";

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
    <BoffContainer variant="secondary">
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
    </BoffContainer>
  );
}
