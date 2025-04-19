"use client";

import { useState, useEffect } from 'react';
import { useBoffSession } from '@/services/useBoffSession';
import { smartrotomService} from '@/services/api/smartrotom/smartrotomService';
import { toast } from 'react-toastify';
import { se } from 'date-fns/locale';
import { arcadeService, ArcadeStreak, ClaimRewardResponse } from '@/services/api/smartrotom/arcadeService';

interface UseArcadeStreakReturn {
  loading: boolean;
  streak: number;
  claimed: boolean;
  rewardAmount: number;
  claimReward: () => Promise<ClaimRewardResponse | null>;
  error: string | null;
}

export function useArcadeStreak(): UseArcadeStreakReturn {
  const { session } = useBoffSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<{
    streak: number;
    claimed: boolean;
    rewardAmount: number;
  }>({
    streak: 0,
    claimed: false,
    rewardAmount: 50
  });

  // Calculate reward amount based on streak
  const calculateRewardAmount = (streak: number) => {
    return 50 + (Math.floor(streak / 5) * 25);
  };

  // Fetch streak data on component mount
  useEffect(() => {
    const fetchStreak = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = (await arcadeService.getArcadeStreak()).data as ArcadeStreak;
        
        // Check if the streak was claimed today
        const today = new Date().toISOString().split('T')[0];
        const claimed = response.lastClaimed === today;
        
        setStreakData({
          streak: response.streak,
          claimed,
          rewardAmount: calculateRewardAmount(response.streak)
        });
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
        setError("No se pudo cargar tu racha diaria. Por favor, inténtalo más tarde.");
        
        // Fallback to local data if available
        const localLastClaimed = localStorage.getItem("arcadeDailyBonus");
        const localStreak = parseInt(localStorage.getItem("arcadeBonusStreak") || "0");
        const today = new Date().toISOString().split('T')[0];
        
        if (localLastClaimed) {
          setStreakData({
            streak: localStreak,
            claimed: localLastClaimed === today,
            rewardAmount: calculateRewardAmount(localStreak)
          });
          
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
  const claimReward = async (): Promise<ClaimRewardResponse | null> => {
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

    if (streakData.claimed) {
      toast.info('Ya has reclamado tu recompensa diaria hoy', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return null;
    }

    try {
      const result = await arcadeService.claimDailyReward(session.user.smartRotomUser?.uuid!);
      const newStreak = result.data?.newStreak || 0;
      
      if (result.statusCode === 200 && result.data) {
        // Update local state
        setStreakData(prev => ({
          ...prev,
          streak: newStreak,
          claimed: true,
          rewardAmount: calculateRewardAmount(newStreak)
        }));
        
        // Also save to localStorage as fallback
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem("arcadeDailyBonus", today);
        localStorage.setItem("arcadeBonusStreak", newStreak.toString());
        
        toast.success(`¡Recompensa obtenida: +${result.data.rewardGiven.amount} ${result.data.rewardGiven.type}!`, {
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
    error
  };
}