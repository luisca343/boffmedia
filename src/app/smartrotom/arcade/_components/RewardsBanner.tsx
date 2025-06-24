"use client";

import { useState, useEffect } from "react";
import { Calendar, Award, Gift, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { arcadeService, DailyRewardsConfig } from "@/services/api/smartrotom/arcadeService";
import { DailyRewardItem } from "@/generated/api";

interface RewardsBannerProps {
  currentDay: number;
  loading: boolean;
}

export default function RewardsBanner({ currentDay, loading }: RewardsBannerProps) {
  const [rewardsConfig, setRewardsConfig] = useState<DailyRewardsConfig | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch rewards config from API
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoadingRewards(true);
        // Import here to avoid circular dependency
        const { smartrotomService } = await import("@/services/api/smartrotom/smartrotomService");
        const response = await arcadeService.getRewardsBanner();
        setRewardsConfig(response.data);
      } catch (err) {
        console.error("Failed to fetch rewards banner:", err);
        setError("No se pudieron cargar las recompensas");
      } finally {
        setLoadingRewards(false);
      }
    };
    
    fetchRewards();
  }, []);

  // Set active index to current day when data loads
  useEffect(() => {
    if (rewardsConfig && currentDay > 0) {
      // Find the reward that matches the current day
      const index: number = rewardsConfig.rewards.findIndex((r: DailyRewardItem) => r.day === currentDay);
      if (index >= 0) setActiveIndex(index);
    }
  }, [rewardsConfig, currentDay]);

  const handlePrevious = () => {
    setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    if (!rewardsConfig) return;
    setActiveIndex(prev => (prev < rewardsConfig.rewards.length - 1 ? prev + 1 : prev));
  };

  if (loadingRewards || loading) {
    return (
      <div className="w-full bg-gray-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl overflow-hidden mb-8 p-8">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-cyan-300">Cargando recompensas...</p>
        </div>
      </div>
    );
  }

  if (error || !rewardsConfig) {
    return null; // Don't show if there's an error
  }

  const activeReward = rewardsConfig.rewards[activeIndex];
  
  // Function to get appropriate icon and color based on reward type
  const getRewardVisuals = (reward: DailyRewardItem) => {
    switch (reward.type.toLowerCase()) {
      case 'stars':
        return { 
          icon: <span className="text-4xl">⭐</span>, 
          bgColor: 'from-yellow-800/70 to-amber-900/70',
          borderColor: 'border-yellow-500/50',
          textColor: 'text-yellow-300'
        };
      case 'box':
      case 'boxes':
        return { 
          icon: <Gift className="h-10 w-10 text-violet-400" />, 
          bgColor: 'from-violet-800/70 to-purple-900/70',
          borderColor: 'border-violet-500/50',
          textColor: 'text-violet-300'
        };
      case 'item':
      case 'items':
        return { 
          icon: <Award className="h-10 w-10 text-blue-400" />, 
          bgColor: 'from-blue-800/70 to-indigo-900/70',
          borderColor: 'border-blue-500/50',
          textColor: 'text-blue-300'
        };
      default:
        return { 
          icon: <Gift className="h-10 w-10 text-green-400" />, 
          bgColor: 'from-green-800/70 to-emerald-900/70',
          borderColor: 'border-green-500/50',
          textColor: 'text-green-300'
        };
    }
  };

  const visuals = getRewardVisuals(activeReward);

  return (
    <div className="w-full bg-gray-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 px-5 py-3 flex items-center">
        <Calendar className="h-5 w-5 text-blue-300 mr-2" />
        <h2 className="text-lg font-bold text-white">Recompensas por Racha Diaria</h2>
        <div className="ml-auto text-sm text-cyan-300 font-mono">
          {rewardsConfig.totalDays} Días
        </div>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Reward showcase */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Reward preview */}
          <div className={`relative w-full md:w-1/3 aspect-square max-w-xs bg-gradient-to-br ${visuals.bgColor} rounded-lg border-2 ${visuals.borderColor} flex flex-col items-center justify-center overflow-hidden`}>
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)] opacity-50"></div>
            
            {/* Day indicator */}
            <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold">
              Día {activeReward.day}
            </div>
            
            {/* Current day indicator */}
            {activeReward.day === currentDay + 1 && (
              <div className="absolute top-3 right-3 bg-yellow-600 text-white px-2 py-0.5 rounded-md text-xs font-bold animate-pulse">
                HOY
              </div>
            )}
            
            {/* Reward icon */}
            <div className="mb-4">
              {visuals.icon}
            </div>
            
            {/* Reward amount */}
            <div className={`text-4xl font-bold ${visuals.textColor}`}>
              +{activeReward.amount}
            </div>
            
            {/* Reward type */}
            <div className="text-white/70 font-medium mt-2 uppercase tracking-wider text-sm">
              {activeReward.type}
            </div>
            
            {/* Optional description */}
            {activeReward.description && (
              <div className="mt-4 text-sm text-white/60 text-center max-w-xs px-4">
                {activeReward.description}
              </div>
            )}
          </div>
          
          {/* Reward timeline */}
          <div className="w-full md:w-2/3 flex flex-col">
            <div className="text-center md:text-left mb-4">
              <h3 className="text-xl font-bold text-cyan-300 mb-1">
                Recompensa del Día {activeReward.day}
              </h3>
              <p className="text-gray-400 text-sm">
                Mantén tu racha para desbloquear todas las recompensas. 
                ¡Conéctate cada día para reclamarlas!
              </p>
            </div>
            
            {/* Days progress */}
            <div className="w-full bg-gray-800/60 rounded-lg p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Progreso</span>
                <span className="text-cyan-300 text-sm font-mono">
                  {currentDay}/{rewardsConfig.totalDays} días
                </span>
              </div>
              
              <div className="relative h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${(currentDay / rewardsConfig.totalDays) * 100}%` }}
                ></div>
              </div>
              
              {/* Day indicators */}
              <div className="relative w-full h-6 mt-1">
                {rewardsConfig.rewards.map((reward: DailyRewardItem, index: number) => {
                  // Calculate position based on day number
                  const position: number = (reward.day / rewardsConfig.totalDays) * 100;
                  const isSpecial: boolean = reward.type.toLowerCase() !== 'stars';
                  
                  return (
                  <div 
                    key={reward.day}
                    className={`absolute w-2 h-2 rounded-full -mt-3 transform -translate-x-1/2 ${
                    reward.day <= currentDay 
                      ? 'bg-cyan-400' 
                      : isSpecial 
                      ? 'bg-purple-500' 
                      : 'bg-gray-500'
                    } ${reward.day === currentDay + 1 ? 'ring-2 ring-yellow-500 ring-offset-1 ring-offset-gray-900' : ''}`}
                    style={{ left: `${position}%` }}
                    onClick={() => setActiveIndex(index)}
                  ></div>
                  );
                })}
              </div>
            </div>
            
            {/* Navigation controls */}
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePrevious}
                disabled={activeIndex === 0}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeIndex === 0 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-cyan-300 hover:bg-gray-800'
                }`}
              >
                <ChevronLeft className="h-5 w-5" /> Anterior
              </button>
              
              <button 
                onClick={handleNext}
                disabled={!rewardsConfig || activeIndex >= rewardsConfig.rewards.length - 1}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  !rewardsConfig || activeIndex >= rewardsConfig.rewards.length - 1 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-cyan-300 hover:bg-gray-800'
                }`}
              >
                Siguiente <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}