import { Card } from "@/components/ui/card";
import { SkyFormData } from "../store";
import {
  QuestConfigurationSection,
  LocationSection,
  PokemonSection,
  RewardSection,
  SettingsSection,
  GenerateButton
} from "./";

interface SkyFormProps {
  formData: SkyFormData;
  onQuestTypeChange: (value: string) => void;
  onSubQuestChange: (value: string) => void;
  onFieldChange: (field: string) => (value: string | number) => void;
  onItemChange: (field: 'targetItem' | 'rewardItem') => (value: string) => void;
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
  onGenerateWonderMail
}: SkyFormProps) {
  return (
    <Card className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl">
      
      {/* Quest Configuration Section */}
      <QuestConfigurationSection
        questType={formData.questType}
        specialQuestType={formData.specialQuestType}
        onQuestTypeChange={onQuestTypeChange}
        onSubQuestChange={onSubQuestChange}
      />

      {/* Location Section */}
      <LocationSection
        dungeon={formData.dungeon}
        floor={formData.floor}
        onDungeonChange={(value) => onFieldChange('dungeon')(value)}
        onFloorChange={(value) => onFieldChange('floor')(value)}
      />

      {/* Pokemon Section */}
      <PokemonSection
        questType={formData.questType}
        specialQuestType={formData.specialQuestType}
        clientPokemon={formData.clientPokemon}
        targetPokemon={formData.targetPokemon}
        clientSprite={formData.clientSprite}
        targetSprite={formData.targetSprite}
        onClientPokemonChange={(value) => onFieldChange('clientPokemon')(value)}
        onTargetPokemonChange={(value) => onFieldChange('targetPokemon')(value)}
      />

      {/* Rewards Section */}
      <RewardSection
        questType={formData.questType}
        rewardType={formData.rewardType}
        targetItem={formData.targetItem}
        rewardItem={formData.rewardItem}
        onRewardTypeChange={(value) => onFieldChange('rewardType')(value)}
        onTargetItemChange={onItemChange('targetItem')}
        onRewardItemChange={onItemChange('rewardItem')}
      />

      {/* Settings Section */}
      <SettingsSection
        europeanVersion={formData.europeanVersion}
        onEuropeanVersionChange={onEuropeanVersionChange}
      />

      {/* Generate Button */}
      <GenerateButton onClick={onGenerateWonderMail} />
    </Card>
  );
}
