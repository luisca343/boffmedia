"use client";

import { useState, useEffect } from "react";
import { Calendar, Sparkles, Gift, Star, Loader2, AlertCircle, Package, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyRewardsConfig, DailyReward } from "@/services/api/smartrotom/smartrotomService";

interface WeeklyStreakProps {
  streak: number;
  claimed: boolean;
  onClaim: () => void;
  rewardAmount: number;
  isLoggedIn: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export default function WeeklyStreak({ 
  streak, 
  claimed, 
  onClaim, 
  rewardAmount, 
  isLoggedIn,
  isLoading = false,
  error = null
}: WeeklyStreakProps) {
  const [rewardsConfig, setRewardsConfig] = useState<DailyRewardsConfig | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);

  // Fetch rewards configuration
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoadingRewards(true);
        // Import here to avoid circular dependency
        const { smartrotomService } = await import("@/services/api/smartrotom/smartrotomService");
        const response = await smartrotomService.getRewardsBanner();
        setRewardsConfig(response.data);
      } catch (err) {
        console.error("Failed to fetch rewards banner:", err);
      } finally {
        setLoadingRewards(false);
      }
    };
    
    fetchRewards();
  }, []);
  
  // Get appropriate styles and icon based on reward type
  const getRewardVisuals = (rewardType: string) => {
    switch(rewardType.toLowerCase()) {
      case 'currency':
        return {
          icon: <Star className="h-6 w-6 text-yellow-300" />,
          bgGradient: "from-yellow-700/40 to-amber-800/40",
          border: "border-yellow-500/50",
          textColor: "text-yellow-300"
        };
      case 'box':
      case 'boxes':
      case 'crate':
      case 'crates':
        return {
          icon: <Package className="h-6 w-6 text-violet-300" />,
          bgGradient: "from-violet-700/40 to-purple-800/40",
          border: "border-violet-500/50",
          textColor: "text-violet-300"
        };
      case 'item':
        return {
          icon: <Award className="h-6 w-6 text-blue-300" />,
          bgGradient: "from-blue-700/40 to-indigo-800/40",
          border: "border-blue-500/50",
          textColor: "text-blue-300"
        };
      default:
        return {
          icon: <Gift className="h-6 w-6 text-green-300" />,
          bgGradient: "from-green-700/40 to-emerald-800/40",
          border: "border-green-500/50",
          textColor: "text-green-300"
        };
    }
  };

  // Determine total days to show (default 7 or from config)
  const daysToShow = 7;

  // Check if a reward type is a named item (ITEM or CRATE)
  const isNamedReward = (type: string) => {
    const lowerType = type.toLowerCase();
    return lowerType === 'item' || lowerType === 'crate' || lowerType === 'box';
  };

  return (
    <div className="w-full bg-gray-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 px-5 py-3 flex items-center">
        <Calendar className="h-5 w-5 text-blue-300 mr-2" />
        <h2 className="text-lg font-bold text-white">Progreso de Racha Diaria</h2>
        <div className="ml-auto text-sm text-cyan-300 font-mono">
          {isLoading || loadingRewards ? (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Cargando...
            </span>
          ) : (
            `Día ${streak + 1}/${rewardsConfig?.totalDays || daysToShow}`
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border-b border-red-500/30 p-2 flex items-center">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}
      
      <div className="p-6 bg-gray-900">
        <div className="grid grid-cols-7 gap-1 md:gap-3">
          {[...Array(daysToShow)].map((_, i) => {
            const isCompleted = i < streak;
            const isCurrent = i === streak && !claimed;
            
            // Check if there's a reward for this day from server
            const dayReward = rewardsConfig?.rewards.find(r => r.day === i + 1);
            
            // Get the visual styles based on reward type
            const visuals = dayReward 
              ? getRewardVisuals(dayReward.type) 
              : {
                  icon: <Star className="h-6 w-6 text-gray-500" />,
                  bgGradient: "",
                  border: "border-gray-700",
                  textColor: "text-gray-400"
                };
            
            // Determine if this is a special day (for fallback)
            const isSpecial = !dayReward && ((i + 1) % 3 === 0 || i === 6);
            
            return (
              <div 
                key={i} 
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border-2 
                  ${isCompleted 
                    ? "bg-gradient-to-br from-blue-500/50 to-indigo-700/50 border-cyan-400" 
                    : isCurrent
                      ? "bg-gradient-to-r from-yellow-500/30 to-amber-600/30 border-yellow-400 animate-pulse" 
                      : dayReward 
                        ? `bg-gradient-to-br ${visuals.bgGradient} ${visuals.border}`
                        : "bg-gray-800/50 border-gray-700"
                  } ${isLoading || loadingRewards ? "opacity-50" : ""} overflow-hidden group`}
                onMouseEnter={() => dayReward?.description && setShowTooltip(i)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                {/* Day indicator (top) */}
                <div className="absolute top-1 left-1 text-xs font-bold text-gray-400">
                  {i + 1}
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
                
                {/* Show reward icon and amount for non-active days */}
                {(!isCompleted && !isCurrent) && (
                  <>
                    {/* Main reward icon */}
                    <div className="mt-1">
                      {visuals.icon}
                    </div>
                    
                    {/* Reward amount */}
                    <div className={`font-bold text-sm ${visuals.textColor}`}>
                      {isNamedReward(dayReward?.type || '') 
                        ? '1×'
                        : `+${dayReward?.amount || (isSpecial ? (i === 6 ? 100 : 50) : 50)}`}
                    </div>
                    
                    {/* Reward type or item name */}
                    <div className="text-[10px] text-gray-300 truncate px-1 text-center max-w-full">
                      {isNamedReward(dayReward?.type || '') && dayReward?.description
                        ? dayReward.description
                        : dayReward?.type === 'currency' 
                          ? 'Estrellas' 
                          : dayReward?.type || 'Estrellas'}
                    </div>
                  </>
                )}
                
                {/* Item description tooltip for longer item names */}
                {showTooltip === i && dayReward?.description && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-blue-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {dayReward.description}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-blue-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Reward claim section */}
        <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm">Colecciona recompensas con el</div>
            <div className="text-purple-300 font-bold">Club de Recompensas Smart Rotom</div>
            <div className="text-gray-400 text-sm">¡Obtén recompensas cada vez mayores!</div>
          </div>
          
          <div className="flex justify-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 relative">
              <div className={`absolute inset-0 bg-purple-600/20 rounded-lg ${isLoading || loadingRewards ? '' : 'animate-pulse'}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Show appropriate icon based on today's reward type */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-800/70 rounded-full flex items-center justify-center border-4 border-purple-500/50 shadow-lg shadow-purple-500/20">
                  {isLoading || loadingRewards ? (
                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                  ) : (
                    <>
                      {/* Get icon based on current day's reward type */}
                      {(() => {
                        const currentDayReward = rewardsConfig?.rewards.find(r => r.day === streak + 1);
                        
                        if (currentDayReward) {
                          switch(currentDayReward.type.toLowerCase()) {
                            case 'box':
                            case 'boxes':
                            case 'crate':
                            case 'crates':
                              return <Package className="h-8 w-8 text-violet-300" />;
                            case 'item':
                              return <Award className="h-8 w-8 text-blue-300" />;
                            case 'currency':
                            default:
                              return <Star className="h-8 w-8 text-purple-300" />;
                          }
                        } else {
                          return <Star className="h-8 w-8 text-purple-300" />;
                        }
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                {(() => {
                  // Get current day's reward
                  const currentDayReward = rewardsConfig?.rewards.find(r => r.day === streak + 1);
                  
                  if (currentDayReward && isNamedReward(currentDayReward.type)) {
                    return "1×";
                  } else {
                    return `+${currentDayReward?.amount || rewardAmount}`;
                  }
                })()}
              </div>
              <div className="text-sm text-purple-300">
                {(() => {
                  // Show reward type or item name
                  const currentDayReward = rewardsConfig?.rewards.find(r => r.day === streak + 1);
                  
                  if (currentDayReward) {
                    if (isNamedReward(currentDayReward.type)) {
                      // Return item name from description
                      return currentDayReward.description || currentDayReward.type;
                    } else if (currentDayReward.type.toLowerCase() === 'currency') {
                      return "Estrellas";
                    } else {
                      return currentDayReward.type;
                    }
                  } else {
                    return "Estrellas";
                  }
                })()}
              </div>
              {/* Show description if available and not an item/crate */}
              {(() => {
                const currentDayReward = rewardsConfig?.rewards.find(r => r.day === streak + 1);
                if (currentDayReward && 
                    currentDayReward.description && 
                    !isNamedReward(currentDayReward.type)) {
                  return (
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      &ldquo;{currentDayReward.description}&rdquo;
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          
          <div>
            <Button
              onClick={onClaim}
              disabled={claimed || !isLoggedIn || isLoading || loadingRewards}
              className={`w-full py-3 text-lg font-bold rounded-md uppercase tracking-wider ${
                isLoading || loadingRewards
                  ? 'bg-gray-700 cursor-wait' 
                  : claimed 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 animate-pulse'
              }`}
            >
              {isLoading || loadingRewards ? (
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
          </div>
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-400">
          Mantén tu racha para maximizar las recompensas - ¡Vuelve todos los días!
        </div>
      </div>
    </div>
  );
}