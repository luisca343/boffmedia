"use client";

import { useState, useEffect } from 'react';
import { useBoffSession } from '@/services/useBoffSession';
import { toast } from 'react-toastify';
import { ArcadeInventoryItem, ArcadeService } from '@/services/api/smartrotom/arcadeService';
import { ArcadeStreak, ArcadeStreakClaim } from '@/generated/api';

interface UseArcadeStreakReturn {
  loading: boolean;
  streak: number;
  claimed: boolean;
  rewardAmount: number;
  claimReward: () => Promise<{
    streak: ArcadeStreak;
    reward: any;
    inventoryItems?: ArcadeInventoryItem[];
  } | null>;
  error: string | null;
  nextReward: any | null;
  currentDay: number;
  totalDays: number;
  lastClaimed: Date | null;
  currentBanner: string | null;
  lastBanner: string | null;
  nextResetTime: Date | null;
  bannerChanged: boolean;
}

export function useArcadeStreak(): UseArcadeStreakReturn {
  const { session } = useBoffSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<{
    streak: number;
    claimed: boolean;
    rewardAmount: number;
    nextReward: any | null;
    currentDay: number;
    totalDays: number;
    lastClaimed: Date | null;
    currentBanner: string | null;
    lastBanner: string | null;
    nextResetTime: Date;
    bannerChanged: boolean;
  }>({
    streak: 0,
    claimed: false,
    rewardAmount: 50,
    nextReward: null,
    currentDay: 1,
    totalDays: 7,
    lastClaimed: null,
    currentBanner: null,
    lastBanner: null,
    nextResetTime: new Date(),
    bannerChanged: false
  });

  // Fetch streak data on component mount
  useEffect(() => {
    console.log("Fetching streak data...");
    const fetchStreak = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = (await ArcadeService.getStreak(session.user.smartRotomUser?.uuid!)).data as ArcadeStreak;

        // Use the claimedToday property directly from the server response
        setStreakData({
          streak: response.streak,
          claimed: response.claimedToday || false,
          rewardAmount: response.nextReward?.amount || 50,
          nextReward: response.nextReward,
          currentDay: response.currentDay || 1,
          totalDays: response.totalDays || 7,
          lastClaimed: response.lastClaimed ? new Date(response.lastClaimed) : null,
          currentBanner: response.currentBanner || null,
          lastBanner: response.lastBanner || null,
          nextResetTime: response.nextResetTime ? new Date(response.nextResetTime) : new Date(),
          bannerChanged: response.bannerChanged || false
        });
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
        setError("No se pudo cargar tu racha diaria. Por favor, inténtalo más tarde.");
        
        // Fallback to local data if available
        const localLastClaimed = localStorage.getItem("arcadeDailyBonus");
        const localStreak = parseInt(localStorage.getItem("arcadeBonusStreak") || "0");
        const today = new Date().toISOString().split('T')[0];
        
        if (localLastClaimed) {
          setStreakData(prev => ({
            ...prev,
            streak: localStreak,
            claimed: localLastClaimed === today,
          }));
          
          toast.error('Usando datos locales. La próxima vez que te conectes, tus datos de racha se sincronizarán', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [session]);

  // Function to claim daily reward
  const claimReward = async (): Promise<ArcadeStreakClaim | null> => {
    if (!session) {
      toast.error('Necesitas iniciar sesión para recibir recompensas diarias', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return null;
    }

    try {
      const result = await ArcadeService.claimDailyReward({uuid: session.user.smartRotomUser?.uuid!});
      const daily = await (await ArcadeService.getStreakStatus(session.user.smartRotomUser?.uuid!)).data!;
      const { streak } = daily;

      console.log("daily", daily);
      
      if (result.statusCode === 200 && result.data) {
        setStreakData({
          streak: streak.streak,
          claimed: true,
          rewardAmount: streak.nextReward?.amount || 50,
          nextReward: streak.nextReward,
          currentDay: streak.currentDay || 1,
          totalDays: streak.totalDays || 7,
          lastClaimed: new Date(),
          currentBanner: streak.currentBanner || streakData.currentBanner,
          lastBanner: streakData.currentBanner,
          nextResetTime: streak.nextResetTime ? new Date(streak.nextResetTime) : new Date(),
          bannerChanged: streak.bannerChanged || false
        });
        
        // Also save to localStorage as fallback
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem("arcadeDailyBonus", today);
        localStorage.setItem("arcadeBonusStreak", result.data.streak.toString());
        
        toast.success(`¡Recompensa obtenida: +${result.data.reward.amount} ${result.data.reward.type}!`, {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        return result.data;
      } else {
        toast.error(result.message || "No se pudo procesar tu recompensa", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        return null;
      }
    } catch (err) {
      console.error("Failed to claim reward:", err);
      setError("Error al reclamar tu recompensa. Por favor, inténtalo más tarde.");
      toast.error('No se pudo contactar con el servidor. Inténtalo más tarde.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return null;
    }
  };

  return {
    loading,
    streak: streakData.streak,
    claimed: streakData.claimed,
    rewardAmount: streakData.rewardAmount,
    claimReward,
    error,
    nextReward: streakData.nextReward,
    currentDay: streakData.currentDay,
    totalDays: streakData.totalDays,
    lastClaimed: streakData.lastClaimed,
    currentBanner: streakData.currentBanner,
    lastBanner: streakData.lastBanner,
    nextResetTime: streakData.nextResetTime,
    bannerChanged: streakData.bannerChanged
  };
}