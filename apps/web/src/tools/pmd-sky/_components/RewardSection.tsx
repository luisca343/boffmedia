import { useTranslations } from "next-intl";
import { GiftIcon, CubeIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Combobox } from "@/components/ui/primitives/combobox";
import { FormField } from "@/components/ui/form/FormField";
import { ToolSectionHeader } from "@/components/boffmedia-old/tools/ToolSectionHeader";
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
  onRewardItemChange,
}: RewardSectionProps) {
  const t = useTranslations("");
  const useTargetItem = getUseTargetItem(questType);
  const rewardGivesItem = givesItem(rewardType);

  return (
    <div className="mb-8">
      <ToolSectionHeader
        icon={<TrophyIcon />}
        label={t("REWARD_SETTINGS")}
      />
      <div className="space-y-6">
        <FormField
          label={t("REWARD_TYPE")}
          icon={<GiftIcon className="w-4 h-4 text-yellow-400" />}
          required
          variant="gaming"
        >
          <Combobox
            data={getRewardTypes(t)}
            value={rewardType.toString()}
            onChange={onRewardTypeChange}
            variant="boff"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            label={t("TARGET_ITEM")}
            icon={<CubeIcon className="w-4 h-4 text-indigo-400" />}
            disabled={!useTargetItem}
            variant="gaming"
          >
            <Combobox
              data={getItemData()}
              value={targetItem.toString()}
              onChange={onTargetItemChange}
              disabled={!useTargetItem}
              variant="boff"
            />
          </FormField>

          <FormField
            label={t("REWARD_ITEM")}
            icon={<GiftIcon className="w-4 h-4 text-pink-400" />}
            disabled={!rewardGivesItem}
            variant="gaming"
          >
            <Combobox
              data={getItemData()}
              value={rewardItem.toString()}
              onChange={onRewardItemChange}
              disabled={!rewardGivesItem}
              variant="boff"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
