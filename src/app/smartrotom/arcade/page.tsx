"use client";

import { useState, useEffect } from "react";
import { WholeWord, Pickaxe, Package, Box, Star } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import StarsBackground from "./_components/StarsBackground";
import WeeklyStreak from "./_components/daily/WeeklyStreak";
import ArcadeGameCard from "./_components/ArcadeGameCard";
import VoltorbImage from "./voltorb/_components/VoltorbIcon";
import { useBoffSession } from "@/services/useBoffSession";
import { useArcadeStreak } from "@/hooks/_main/useArcadeStreak";
import { ToastContainer } from "react-toastify";
import { useTranslations } from "next-intl";
import { getItemName } from "@/lib/intlUtils";
import { isNamedReward } from "./_util/rewardIcons";
import { ItemImage } from "@/lib/ItemImage";

export default function CentroArcade() {
  const { session } = useBoffSession();
  const t = useTranslations();
  const { 
    loading, 
    streak, 
    claimed, 
    rewardAmount, 
    claimReward, 
    error,
    nextReward,
    currentDay,
    totalDays,
    currentBanner,
    lastBanner,
    nextResetTime,
    bannerChanged,
  } = useArcadeStreak();
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);
  const [claimedReward, setClaimedReward] = useState<any>(null);
  
  const handleClaimDailyBonus = async () => {
    const result = await claimReward();
    
    if (result && result.success) {
      // Store the claimed reward details
      setClaimedReward(result.rewardGiven);
      
      // Show animation
      setShowBonusAnimation(true);
      
      // Hide animation after a delay
      setTimeout(() => {
        setShowBonusAnimation(false);
      }, 3000);
    }
  };
  
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-950 via-purple-950 to-violet-950 flex flex-col items-center p-4 relative overflow-auto font-mono">
      <StarsBackground />
      
      {/* Toast container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Retro Arcade Cabinet Frame */}
      <div className="absolute inset-x-0 top-0 h-20 bg-indigo-950 border-b-4 border-cyan-400 shadow-lg shadow-cyan-500/20 z-10">
        <div className="h-full flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 animate-text-shine px-4 text-center">
            Tu Estación Retro Arcade Sorprendente
          </h1>
        </div>
        
        {/* Decorative cabinet screws */}
        <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-gray-400 shadow-inner"></div>
        <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-gray-400 shadow-inner"></div>
      </div>
      
      {/* Animated reward overlay */}
      {showBonusAnimation && claimedReward && (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-indigo-950/50 backdrop-blur-sm">
        <div className="relative flex flex-col items-center">
          {/* Animated background effects */}
          <div className="absolute inset-0 animate-pulse-slow -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full scale-150 blur-3xl"></div>
          </div>
          
          {/* Animated stars around the reward */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-ping text-yellow-400"
              style={{
                fontSize: `${Math.random() * 24 + 16}px`,
                transform: `rotate(${i * 30}deg) translate(${80 + Math.random() * 40}px)`,
                animation: `ping ${1 + Math.random() * 0.5}s infinite ease-in-out`
              }}
            >
              ★
            </div>
          ))}
          
          {/* Main reward container with improved visuals */}
          <div className="animate-bounce-gentle flex flex-col items-center">
            <div className="text-center bg-gradient-to-b from-indigo-900/80 to-purple-900/80 px-10 py-6 rounded-2xl backdrop-blur-md shadow-xl shadow-indigo-500/30 border-2 border-indigo-400/30">
              {/* Item icon with improved display - centered */}
              <div className="relative mb-6 flex justify-center">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-full blur-md"></div>
                {isNamedReward(claimedReward.type) && claimedReward.description ? (
                  <div className="relative z-10 p-2 flex items-center justify-center">
                    <ItemImage 
                      type={claimedReward.type.toLowerCase() === 'box' ? 'box' : 'item'} 
                      itemId={claimedReward.description} 
                      size={96}
                    />
                  </div>
                ) : (
                  <div className="relative z-10 h-24 w-24 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-lg shadow-yellow-500/50">
                    <Star className="h-12 w-12 text-yellow-100" />
                  </div>
                )}
              </div>
              
              {/* Reward amount with improved text */}
              <div className="text-4xl font-bold text-yellow-300 mb-2">
                {isNamedReward(claimedReward.type) ? '¡1× Obtenido!' : `+${claimedReward.amount}`}
              </div>
              
              {/* Reward name with improved styling */}
              <div className="text-3xl text-white font-bold text-shadow-lg">
                {isNamedReward(claimedReward.type) && claimedReward.description
                  ? getItemName(t, claimedReward.description)
                  : claimedReward.type.toLowerCase() === 'currency' 
                    ? '¡Estrellas!' 
                    : `¡${claimedReward.type}!`}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center z-10 pt-24 pb-10 px-4">
        {/* Weekly Streak Progress */}
        <WeeklyStreak 
          streak={streak} 
          claimed={claimed} 
          onClaim={handleClaimDailyBonus} 
          rewardAmount={rewardAmount}
          isLoggedIn={!!session}
          isLoading={loading}
          error={error}
          currentBanner={currentBanner}
          lastBanner={lastBanner}
          nextReward={nextReward}
          currentDay={currentDay}
          totalDays={totalDays}
          uuid={session?.user?.smartRotomUser?.uuid}
          nextResetTime={nextResetTime}
          bannerChanged={bannerChanged}
        />
        
        {/* Inventory Banner */}
        <div className="w-full mb-8 relative">
          <InternalLink 
            href="/arcade/loot"
            className="group block w-full bg-gradient-to-r from-blue-900/90 to-indigo-900/90 rounded-xl overflow-hidden border-4 border-blue-700/50 shadow-2xl transition-all hover:shadow-blue-500/20 hover:border-blue-600/70"
          >
            <div className="absolute inset-0 bg-[url('/images/treasure-pattern.png')] opacity-10 group-hover:opacity-20 transition-opacity"></div>
            
            <div className="relative flex flex-col md:flex-row items-center p-4 md:p-6">
              {/* Left side - Chest icon */}
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-800/80 to-blue-600/60 p-4 md:p-6 rounded-full border-2 border-blue-400/30 shadow-inner shadow-blue-700/50 group-hover:shadow-blue-400/50 transition-all mb-4 md:mb-0 md:mr-6">
                <div className="relative">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-blue-300 group-hover:text-blue-200 transition-colors" />
                  <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold shadow-md animate-pulse">!</div>
                </div>
              </div>
              
              {/* Right side - Content */}
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-300 mb-2 group-hover:text-blue-200">
                  Inventario de Cajas
                </h2>
                <p className="text-blue-200/80 mb-3 max-w-xl">
                  Accede a tu inventario de cajas y desbloquea recompensas especiales. ¡Colecciona objetos raros para tu aventura!
                </p>
                <div className="inline-flex items-center gap-2 bg-blue-700/50 px-4 py-2 rounded-lg text-blue-200 font-bold group-hover:bg-blue-600/60 transition-colors">
                  <Box className="h-5 w-5" /> 
                  <span>VER INVENTARIO</span>
                  <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">NUEVO</span>
                </div>
              </div>
            </div>
          </InternalLink>
        </div>
        
        {/* Games Section Title with Enhanced Style */}
        <div className="w-full text-center mb-8">
          <div className="inline-block relative">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 pb-1">
              Juegos Arcade
            </h2>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Game Cards - Using our new component */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
          <ArcadeGameCard
            title="Squirdle"
            description="Adivina la palabra oculta en este juego de palabras. ¡Pon a prueba tus conocimientos!"
            href="/arcade/squirdle"
            icon={<WholeWord className="w-20 h-20 text-yellow-400" />}
            color="yellow"
            badge={{ text: "NUEVO", type: "new" }}
          />
          
          <ArcadeGameCard
            title="Minería"
            description="Excava profundo y encuentra tesoros ocultos. Consigue objetos valiosos para tu colección."
            href="/mina"
            icon={<Pickaxe className="w-20 h-20 text-orange-400" />}
            color="orange"
          />
          
          <ArcadeGameCard
            title="Gira Voltorb"
            description="¡No dejes que explote! Gira las cartas con cuidado y acumula puntos en este emocionante juego."
            href="/arcade/voltorb"
            icon={<div className="scale-150"><VoltorbImage size="xl" /></div>}
            color="pink"
            badge={{ text: "HOT", type: "hot" }}
          />
        </div>
        
        {/* Mobile-friendly Inventory Button */}
        <div className="lg:hidden w-full mb-8">
          <InternalLink
            href="/arcade/loot"
            className="block w-full bg-gradient-to-r from-blue-800 to-blue-600 py-4 rounded-lg shadow-lg text-center text-white font-bold text-lg flex items-center justify-center gap-2"
          >
            <Package className="h-5 w-5" />
            Acceder al Inventario de Cajas
          </InternalLink>
        </div>
        
        {/* Retro cabinet footer */}
        <div className="w-full bg-gray-900/70 rounded-lg border border-gray-700 p-4 text-center">
          <p className="text-cyan-400 font-bold mb-1">
            Arcade v1.0 • SmartRotom Experience
          </p>
          <p className="text-gray-400 text-sm">
            ¡Gana estrellas y desbloquea recompensas jugando cada día!
          </p>
          
          {/* Pixel art decoration */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="h-4 w-4 bg-blue-500"></div>
            <div className="h-4 w-4 bg-red-500"></div>
            <div className="h-4 w-4 bg-yellow-500"></div>
            <div className="h-4 w-4 bg-green-500"></div>
            <div className="h-4 w-4 bg-purple-500"></div>
          </div>
        </div>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
        .text-shadow-lg {
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 4s linear infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 1.5s infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.8; }
          100% { transform: translateY(0) translateX(0); opacity: 0.2; }
        }
        .animate-float-particle {
          animation: float-particle 3s infinite ease-in-out;
        }
        :root {
          --yellow-rgb: 253, 224, 71;
          --orange-rgb: 249, 115, 22;
          --pink-rgb: 236, 72, 153;
          --blue-rgb: 59, 130, 246;
          --purple-rgb: 168, 85, 247;
          --green-rgb: 16, 185, 129;
        }
  
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}