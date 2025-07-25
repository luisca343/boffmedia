import { useTranslations } from "next-intl";
import { HiCursorClick, HiViewBoards, HiSparkles } from "react-icons/hi";
import { Combobox } from "@/components/ui/combobox";
import { SectionHeader } from "@/components/form";
import { FormField } from "@/components/form";
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