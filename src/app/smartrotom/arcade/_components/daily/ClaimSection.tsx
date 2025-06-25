import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getItemName } from "@/lib/intlUtils";
import { useTranslations } from "next-intl";
import { getRewardIcon, isNamedReward } from "../../_util/rewardIcons";
import { DailyRewardItem, DailyRewardsConfig } from "@/generated/api";

interface ClaimSectionProps {
  nextReward: DailyRewardItem | undefined;
  currentDay: number;
  rewardAmount: number;
  rewardsConfig: DailyRewardsConfig | null;
  claimed: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  onClaim: () => void;
  timeUntilReset: string;
}

export default function ClaimSection({
  nextReward,
  currentDay,
  rewardAmount,
  rewardsConfig,
  claimed,
  isLoggedIn,
  isLoading,
  onClaim,
  timeUntilReset
}: ClaimSectionProps) {
  const t = useTranslations();
  
  
  const getCurrentReward = () => {
    if (nextReward) {
      return nextReward;
    }
    return rewardsConfig?.rewards.find((r: DailyRewardItem) => r.day === currentDay);
  };
  
  const currentReward = getCurrentReward();
  
  return (
    <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="text-gray-400 text-sm">Colecciona recompensas con el</div>
        <div className="text-purple-300 font-bold">Club de Recompensas Smart Rotom</div>
        <div className="text-gray-400 text-sm">¡Obtén recompensas cada vez mayores!</div>
      </div>
      
      <div className="flex justify-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 relative">
          <div className={`absolute inset-0 bg-purple-600/20 rounded-lg ${isLoading ? '' : 'animate-pulse'}`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Show appropriate icon based on today's reward type */}
            <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-800/70 rounded-full flex items-center justify-center border-4 border-purple-500/50 shadow-lg shadow-purple-500/20">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              ) : (
                getRewardIcon({ 
                  type: currentReward?.type || 'currency', 
                  description: currentReward?.description || '', 
                  size: 32 
                })
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-2xl md:text-3xl font-bold text-yellow-400">
            {(() => {
              if (currentReward) {
                if (isNamedReward(currentReward.type)) {
                  return "1×";
                } else {
                  return `+${currentReward.amount}`;
                }
              } else {
                return `+${rewardAmount}`;
              }
            })()}
          </div>
          <div className="text-sm text-purple-300">
            {(() => {
              if (currentReward) {
                if (isNamedReward(currentReward.type)) {
                  return getItemName(t, currentReward.description)
                } else if (currentReward.type.toLowerCase() === 'currency') {
                  return "Estrellas";
                } else {
                  return currentReward.type;
                }
              } else {
                return "Estrellas";
              }
            })()}
          </div>
          {/* Show description if available and not an item/crate */}
          {currentReward && currentReward.description && !isNamedReward(currentReward.type) && (
            <div className="text-xs text-gray-400 mt-1 text-center">
              &ldquo;{getItemName(t, currentReward.description)}&rdquo;
            </div>
          )}
        </div>
      </div>
      
      <div>
        <Button
          onClick={onClaim}
          disabled={claimed || !isLoggedIn || isLoading}
          className={`w-full py-3 text-lg font-bold rounded-md uppercase tracking-wider ${
            isLoading
              ? 'bg-gray-700 cursor-wait' 
              : claimed 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 animate-pulse'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando...
            </span>
          ) : claimed ? (
            'Reclamado Hoy'
          ) : (
            'Reclamar'
          )}
        </Button>
        
        {!isLoggedIn && (
          <div className="text-xs text-red-400 font-medium mt-1 text-center">
            Necesitas iniciar sesión para reclamar recompensas
          </div>
        )}
        
        {/* Reset time reminder */}
        {(claimed && timeUntilReset !== '...') && (
          <div className="text-xs text-cyan-400 font-medium mt-1 text-center">
            Próxima recompensa disponible a las 6:00 AM (en {timeUntilReset})
          </div>
        )}
      </div>
    </div>
  );
}