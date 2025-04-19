import { motion } from "framer-motion";
import Image from "next/image";
import { Item } from "../../types";
import { getItemName } from "@/lib/intlUtils";
import { Sparkles } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { useTranslations } from "next-intl";

interface SpinnerItemProps {
  item: Item;
  index: number;
  isWinningItem: boolean;
  winningIndex: number | null;
}

export function SpinnerItem({ item, index, isWinningItem, winningIndex }: SpinnerItemProps) {
  const t = useTranslations("");
  const config = getRarityConfig(item.rarity);
  
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
      <div className="relative w-32 h-32 mb-2">
        <Image
          src={item.image || "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png"}
          alt={getItemName(t, item.id)}
          width={128}
          height={128}
          className="object-contain"
          priority={index < 20} // Prioritize loading images that appear first
          style={{ imageRendering: "pixelated" }}
        />
        
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
        {getItemName(t, item.id)}
      </h3>
      
      <div className={`${config.textColor} text-xs uppercase tracking-wider mt-1`}>
        {item.rarity}
      </div>
    </div>
  );
}