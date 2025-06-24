import { useState } from "react";
import { Sparkles, Gift } from "lucide-react";
import { getItemName } from "@/lib/intlUtils";
import { useTranslations } from "next-intl";
import { getRewardIcon, getRewardVisuals, isNamedReward } from "../../_util/rewardIcons";
import { DailyRewardItem } from "@/generated/api";

interface DayRewardProps {
  day: number;
  currentDay: number;
  claimed: boolean;
  dayReward?: DailyRewardItem;
  isLoading: boolean;
}

export default function DayReward({ 
  day, 
  currentDay, 
  claimed, 
  dayReward, 
  isLoading 
}: DayRewardProps) {
  const t = useTranslations();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const dayNumber = day;
  const isCompleted = dayNumber < currentDay || (dayNumber === currentDay && claimed);
  const isCurrent = dayNumber === currentDay && !claimed;
  
  // Determine if this is a special day (for fallback)
  const isSpecial = !dayReward && (dayNumber % 3 === 0 || dayNumber === 7);
  
  // Get the visual styles based on reward type
  const visuals = dayReward 
    ? getRewardVisuals(dayReward.type) 
    : {
        bgGradient: "",
        border: "border-gray-700",
        textColor: "text-gray-400"
      };
  
  return (
    <div 
      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border-2 
        ${isCompleted 
          ? "bg-gradient-to-br from-blue-500/50 to-indigo-700/50 border-cyan-400" 
          : isCurrent
            ? "bg-gradient-to-r from-yellow-500/30 to-amber-600/30 border-yellow-400 animate-pulse" 
            : dayReward 
              ? `bg-gradient-to-br ${visuals.bgGradient} ${visuals.border}`
              : "bg-gray-800/50 border-gray-700"
        } ${isLoading ? "opacity-50" : ""} overflow-hidden group`}
      onMouseEnter={() => dayReward?.description && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Day indicator (top) */}
      <div className="absolute top-1 left-1 text-xs font-bold text-gray-400">
        {dayNumber}
      </div>

      {/* Always render the reward icon, which will be shown or overlaid */}
      <div className="mt-1">
        {dayReward 
          ? getRewardIcon({ type: dayReward.type, description: dayReward.description, size: 64 })
          : getRewardIcon({ type: "currency", size: 24 })}
      </div>
      
      {/* Reward amount - will be shown or overlaid */}
      <div className={`font-bold text-sm ${visuals.textColor}`}>
        {isNamedReward(dayReward?.type || '') 
          ? '1×'
          : `+${dayReward?.amount || (isSpecial ? (dayNumber === 7 ? 100 : 50) : 50)}`}
      </div>
      
      {/* Reward type or item name - will be shown or overlaid */}
      <div className="text-[10px] text-gray-300 truncate px-1 text-center max-w-full">
        {isNamedReward(dayReward?.type || '') && dayReward?.description
          ? getItemName(t, dayReward.description)
          : dayReward?.type === 'coins' 
            ? 'Estrellas' 
            : dayReward?.type || 'Estrellas'}
      </div>

      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 to-indigo-700/50 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-yellow-300" />
          <div className="absolute bottom-1 text-xs text-cyan-300">Reclamado</div>
        </div>
      )}

      {/* Current day overlay */}
      {isCurrent && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-amber-600/30 flex items-center justify-center">
          <Gift className="h-7 w-7 text-yellow-300" />
          <div className="absolute bottom-1 text-xs text-yellow-300 animate-pulse">HOY</div>
        </div>
      )}
      
      {/* Item description tooltip for longer item names */}
      {showTooltip && dayReward?.description && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-blue-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {getItemName(t, dayReward.description)}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-blue-900"></div>
        </div>
      )}
    </div>
  );
}