import { useTranslations } from "next-intl";
import { HiCursorClick, HiViewBoards, HiSparkles } from "react-icons/hi";
import { Combobox } from "@/components/ui/combobox";
import { SectionHeader } from "./SectionHeader";
import { FormField } from "./FormField";
import { getQuestData, getSubQuestData, getForceClient } from "../QuestData";

interface QuestConfigurationSectionProps {
  questType: number;
  specialQuestType: number;
  onQuestTypeChange: (value: string) => void;
  onSubQuestChange: (value: string) => void;
}

export function QuestConfigurationSection({
  questType,
  specialQuestType,
  onQuestTypeChange,
  onSubQuestChange
}: QuestConfigurationSectionProps) {
  const t = useTranslations("");
  const isClientForced = getForceClient(questType, specialQuestType) > 0;

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<HiCursorClick className="w-5 h-5" />} 
        title={t("QUEST_CONFIGURATION")} 
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField 
          label={t("QUEST_TYPE")} 
          icon={<HiViewBoards className="w-4 h-4 text-blue-400" />}
          required
        >
          <Combobox 
            variant="orange"
            className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors"
            data={getQuestData(t)}
            value={questType.toString()}
            onChange={onQuestTypeChange}
          />
        </FormField>

        <FormField 
          label={t("QUEST_SUBTYPE")} 
          icon={<HiSparkles className="w-4 h-4 text-purple-400" />}
          disabled={!isClientForced}
        >
          <Combobox 
            variant="orange"
            className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
            data={getSubQuestData(questType, t)}
            value={specialQuestType.toString()}
            disabled={!isClientForced}
            onChange={onSubQuestChange}
          />
        </FormField>
      </div>
    </div>
  );
}
