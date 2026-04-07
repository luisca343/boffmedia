import { motion } from "framer-motion";
import Image from "next/image";
import { getItemName } from "@/lib/intlUtils";
import { Sparkles } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { useTranslations } from "next-intl";
import { ItemImage } from "@/lib/ItemImage";
import { ArcadeInventoryItem, LootboxItemConfig } from "@boffmedia/shared";
import { getRewardIcon } from "../../../_util/rewardIcons";

interface SpinnerItemProps {
  item: LootboxItemConfig;
  index: number;
  isWinningItem: boolean;
  winningIndex: number | null;
}

export function SpinnerItem({ item, index, isWinningItem, winningIndex }: SpinnerItemProps) {
  const t = useTranslations("");
  const config = getRarityConfig(item.rarity as ArcadeInventoryItem.rarity);
  
  return (
    <div
      key={`${item.id}-${index}`}
      className={`flex-shrink-0 w-[170px] h-56 mx-[5px] p-4 rounded-lg flex flex-col items-center justify-center 
        ${isWinningItem ? `scale-110 z-10 border-4 ${config.glow}` : 'border-2'} ${config.borderColor} ${config.bgColor}`}
      style={{ 
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: '170px'
      }}
    >
      <div className="relative w-32 h-32 mb-2 items-center flex justify-center">
        {getRewardIcon({type: item.type, description: item.data || item.id, size: 128})}

        {/* Special effects for rare items */}
        {(item.rarity === 'epic' || item.rarity === 'legendary') && (
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Sparkles className={`w-full h-full ${config.textColor} opacity-30`} />
          </motion.div>
        )}
      </div>
      
      <h3 className={`${config.textColor} font-bold text-center text-sm md:text-base`}>
        {getItemName(t, item.id, item.type)}
      </h3>
      
      <div className={`${config.textColor} text-xs uppercase tracking-wider mt-1`}>
        {item.rarity}
      </div>
          {item.amount !== undefined && item.amount > 1 && (
            <div className={`${config.textColor} text-xs font-semibold mt-1`}>
              x{item.amount}
            </div>
          )}
    </div>
  );
}