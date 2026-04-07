import { motion } from "framer-motion";
import Image from "next/image";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { getItemDescription, getItemName } from "@/lib/intlUtils";
import { Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { ItemImage } from "@/lib/ItemImage";
import { ArcadeInventoryItem, LootboxItemConfig } from "@boffmedia/shared";
import { getRewardIcon } from "../../../_util/rewardIcons";
import { Item } from "@radix-ui/react-select";

interface ResultDisplayProps {
  wonItem: LootboxItemConfig;
  onComplete: () => void;
}

export function ResultDisplay({ wonItem, onComplete }: ResultDisplayProps) {
  const t = useTranslations("");
  const config = getRarityConfig(wonItem.rarity as ArcadeInventoryItem.rarity);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="z-50 absolute mb-10 w-full max-w-md bg-surface-900/90 rounded-xl p-6 border-4 border-cyan-500/50 shadow-xl"
    >
      {/* Cabinet top */}
      <div className="bg-gradient-to-r from-surface-800 to-surface-900 -mt-6 -mx-6 mb-6 py-2 px-4 border-b-2 border-surface-700 flex justify-center">
        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary-400 animate-text-shine px-4 text-center">
          ¡Objeto Obtenido!
        </div>
      </div>
      
      {/* Cabinet screws */}
      <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-surface-600 shadow-inner"></div>
      <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-surface-600 shadow-inner"></div>
      
      <div className={`flex flex-col items-center p-4 rounded-lg ${config.bgColor} border-2 ${config.borderColor} ${config.glow}`}>
        <h3 className={`text-xl font-bold ${config.textColor} mb-2 text-center`}>
          {getItemName(t, wonItem.id, wonItem.type)}
        </h3>
        {wonItem.amount && wonItem.amount > 1 && (
          <p className="text-surface-300 text-xs mt-0.5 font-medium">
            x{wonItem.amount}
          </p>
        )}
        
        <div className="relative w-32 h-32 mb-4">
          {getRewardIcon({type: wonItem.type, description: wonItem.data || wonItem.id, size: 128})}
          
          {/* Special effects for legendary items */}
          {wonItem.rarity === 'legendary' && (
            <>
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-yellow-500/20 border-dashed"
              />
              
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sparkles className="w-full h-full text-yellow-400 opacity-30" />
              </motion.div>
            </>
          )}
        </div>
        
        <div className={`px-3 py-1 rounded-full ${config.textColor} bg-surface-950/60 mb-4 text-center font-bold uppercase tracking-wider text-sm`}>
          {wonItem.rarity}
        </div>
        
        <p className="text-surface-200 text-center mb-4 bg-black/40 p-3 rounded-lg border border-surface-800">
          {wonItem.type === 'pokemon' ? wonItem.id : getItemDescription(t, wonItem.id)}
        </p>
      </div>
      
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 10, delay: 1 }}
        onClick={onComplete}
        className="w-full mt-6 bg-gradient-to-r from-highlight-600 to-emerald-600 hover:from-highlight-500 hover:to-emerald-500 text-white px-6 py-3 rounded-md flex items-center justify-center space-x-2 font-bold shadow-lg border-2 border-highlight-500/50"
      >
        <Check className="w-5 h-5" />
        <span>¡Añadir a colección!</span>
      </motion.button>
    </motion.div>
  );
}