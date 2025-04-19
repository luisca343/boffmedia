"use client";

import { useState, useEffect } from "react";
import { arcadeService, DailyRewardsConfig } from "@/services/api/smartrotom/arcadeService";
import StreakHeader from "./StreakHeader";
import StreakNotifications from "./StreakNotifications";
import DaysGrid from "./DaysGrid";
import ClaimSection from "./ClaimSection";

interface WeeklyStreakProps {
  streak: number;
  claimed: boolean;
  onClaim: () => void;
  rewardAmount: number;
  isLoggedIn: boolean;
  isLoading?: boolean;
  error?: string | null;
  currentBanner?: string | null;
  lastBanner?: string | null;
  nextReward?: any;
  currentDay?: number;
  totalDays?: number;
  uuid?: string;
  nextResetTime?: Date | null;
  bannerChanged?: boolean;
}

export default function WeeklyStreak({ 
  streak,
  claimed, 
  onClaim, 
  rewardAmount, 
  isLoggedIn,
  isLoading = false,
  error = null,
  currentBanner,
  lastBanner,
  nextReward,
  currentDay = 1,
  totalDays = 7,
  nextResetTime,
  bannerChanged = false
}: WeeklyStreakProps) {
  const [rewardsConfig, setRewardsConfig] = useState<DailyRewardsConfig | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  

  // Calculate time until next reset
  const getTimeUntilReset = () => {
    if (nextResetTime) {
      const now = new Date();
      const diff = new Date(nextResetTime).getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    }
    return "...";
  };

  // Fetch rewards configuration
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoadingRewards(true);
        const response = await arcadeService.getRewardsBanner();
        setRewardsConfig(response.data!);
      } catch (err) {
        console.error("Failed to fetch rewards banner:", err);
      } finally {
        setLoadingRewards(false);
      }
    };
    
    fetchRewards();
  }, []);
  
  const isComponentLoading = isLoading || loadingRewards;

  return (
    <div className="w-full bg-gray-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl overflow-hidden mb-8">
      <StreakHeader
        currentBanner={currentBanner}
        currentDay={currentDay}
        totalDays={totalDays}
        isLoading={isComponentLoading}
      />
      
      <StreakNotifications
        bannerChanged={bannerChanged}
        claimed={claimed}
        error={error}
        timeUntilReset={getTimeUntilReset()}
      />
      
      <div className="p-6 bg-gray-900">
        <DaysGrid
          totalDays={totalDays}
          currentDay={currentDay}
          claimed={claimed}
          rewardsConfig={rewardsConfig}
          isLoading={isComponentLoading}
        />
        
        <ClaimSection
          nextReward={nextReward}
          currentDay={currentDay}
          rewardAmount={rewardAmount}
          rewardsConfig={rewardsConfig}
          claimed={claimed}
          isLoggedIn={isLoggedIn}
          isLoading={isComponentLoading}
          onClaim={onClaim}
          timeUntilReset={getTimeUntilReset()}
        />
      </div>
    </div>
  );
}