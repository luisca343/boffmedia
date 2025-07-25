import { useTranslations } from "next-intl";
import { HiGift, HiCursorClick } from "react-icons/hi";
import { Combobox } from "@/components/ui/combobox";
import { SectionHeader } from "./SectionHeader";
import { FormField } from "./FormField";
import { getRewardTypes, getUseTargetItem, givesItem } from "../QuestData";
import { getItemData } from "../ItemData";

interface RewardSectionProps {
  questType: number;
  rewardType: number;
  targetItem: number;
  rewardItem: number;
  onRewardTypeChange: (value: string) => void;
  onTargetItemChange: (value: string) => void;
  onRewardItemChange: (value: string) => void;
}

export function RewardSection({
  questType,
  rewardType,
  targetItem,
  rewardItem,
  onRewardTypeChange,
  onTargetItemChange,
  onRewardItemChange
}: RewardSectionProps) {
  const t = useTranslations("");
  const useTargetItem = getUseTargetItem(questType);
  const rewardGivesItem = givesItem(rewardType);

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<HiGift className="w-5 h-5" />} 
        title={t("REWARD_SETTINGS")} 
      />
      <div className="space-y-6">
        <FormField 
          label={t("REWARD_TYPE")} 
          icon={<HiGift className="w-4 h-4 text-yellow-400" />}
          required
        >
          <Combobox 
            variant="orange"
            className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors"
            data={getRewardTypes(t)}
            value={rewardType.toString()}
            onChange={onRewardTypeChange}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField 
            label={t("TARGET_ITEM")} 
            icon={<HiCursorClick className="w-4 h-4 text-indigo-400" />}
            disabled={!useTargetItem}
          >
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
              data={getItemData()}
              value={targetItem.toString()}
              onChange={onTargetItemChange}
              disabled={!useTargetItem}
            />
          </FormField>

          <FormField 
            label={t("REWARD_ITEM")} 
            icon={<HiGift className="w-4 h-4 text-pink-400" />}
            disabled={!rewardGivesItem}
          >
            <Combobox 
              variant="orange"
              className="w-full bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors disabled:opacity-50"
              data={getItemData()}
              value={rewardItem.toString()}
              onChange={onRewardItemChange}
              disabled={!rewardGivesItem}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
