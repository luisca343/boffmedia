import { useTranslations } from "next-intl";
import { ClipboardDocumentListIcon, DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Combobox } from "@/components/ui/primitives/combobox";
import { FormField } from "@/components/ui/form/FormField";
import { ToolSectionHeader } from "@components/boffmedia/tools/ToolSectionHeader";
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
  onSubQuestChange,
}: QuestConfigurationSectionProps) {
  const t = useTranslations("");
  const isClientForced = getForceClient(questType, specialQuestType) > 0;

  return (
    <div className="mb-8">
      <ToolSectionHeader
        icon={<ClipboardDocumentListIcon />}
        label={t("QUEST_CONFIGURATION")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          label={t("QUEST_TYPE")}
          icon={<DocumentTextIcon className="w-4 h-4 text-secondary-400" />}
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
          icon={<SparklesIcon className="w-4 h-4 text-accent-400" />}
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
