"use client"
import type { Battle } from "@pkmn/client"
import useViewportWidth from "@/services/useViewPortWidth"
import { PokemonTeam } from "./PokemonTeam"
import { useEffect, useState } from "react"
import BattlePreviewAvatar from "./BattlePreviewAvatar"
import { getParticipantName } from "../_utils/replayUtils"

export const EnhancedBattlePreview = ({
  battle,
  pov,
  onStartBattle,
}: {
  battle: Battle
  pov: 0 | 1 | any
  onStartBattle?: () => void
}) => {
  const [, canvasWidth] = useViewportWidth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const p1 = pov === 0 ? battle.p1 : battle.p2
  const p2 = pov === 0 ? battle.p2 : battle.p1

  const p1Name = getParticipantName(p1.name)
  const p2Name = getParticipantName(p2.name)

  useEffect(() => {
    // Add animation delay for elements to appear
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      id="battle-preview"
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer relative overflow-hidden z-[999]"
      onClick={onStartBattle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Dynamic background with battle arena */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary-900 via-indigo-900 to-accent-900 z-0 transition-all duration-500">
        {/* Battle arena floor */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-surface-800 to-transparent"></div>

        {/* Animated particles */}
        <div className={`stars ${isHovering ? 'stars-hover' : ''}`}></div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center justify-between w-full h-full relative z-10 py-4">
        {/* Top Section - Battle Info */}
        <div 
          className={`bg-black bg-opacity-50 px-6 py-3 rounded-lg backdrop-blur-sm transition-all duration-700 
            ${isLoaded ? "opacity-100 transform-none" : "opacity-0 -translate-y-10"}`}
        >
          <h2 className="text-white text-xl md:text-2xl font-bold text-center">
            Título de la Batalla
          </h2>
        </div>

        {/* Player Sprites */}
        <div className="relative w-full flex items-end justify-between px-8 md:px-16 mt-auto">
          {/* Player 1 Avatar & Name */}
          <div
            className={`flex flex-col items-center transition-all duration-700 delay-400 
              ${isLoaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <BattlePreviewAvatar side={p1} pov={pov} size="large" 
              className={`drop-shadow-2xl transition-transform duration-300 ${isHovering ? 'scale-105' : ''}`} />
            <div className="mt-3 bg-black bg-opacity-60 px-4 py-1 rounded-full backdrop-blur-sm">
              <p className="text-white font-bold text-lg">{p1Name}</p>
            </div>
          </div>

          {/* VS Element */}
          <div
            className={`flex flex-col items-center z-20 transition-all duration-700 delay-200 
              ${isLoaded ? "opacity-100 transform-none" : "opacity-0 scale-50"}`}
          >
            <div className="relative scale-up-down-animation">
              <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary-500 text-shadow-lg transform -rotate-6">
                VS
              </div>
              <div className="absolute inset-0 text-6xl md:text-7xl lg:text-8xl font-extrabold text-white text-opacity-30 text-shadow-lg transform -rotate-6 blur-md">
                VS
              </div>
            </div>
            
            {/* Start Button */}
            <button 
              className={`mt-6 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-full 
                transform transition-all duration-300 pulse-animation ${isHovering ? 'scale-110 shadow-lg' : ''}`}
            >
              COMENZAR
            </button>
          </div>

          {/* Player 2 Avatar & Name */}
          <div
            className={`flex flex-col items-center transition-all duration-700 delay-400 
              ${isLoaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <BattlePreviewAvatar side={p2} pov={pov} size="large" 
              className={`drop-shadow-2xl transition-transform duration-300 ${isHovering ? 'scale-105' : ''}`} />
            <div className="mt-3 bg-black bg-opacity-60 px-4 py-1 rounded-full backdrop-blur-sm">
              <p className="text-white font-bold text-lg">{p2Name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }
        
        .scale-up-down-animation {
          animation: scaleUpDown 2s infinite alternate ease-in-out;
        }
        
        .pulse-animation {
          animation: pulse 2s infinite;
          will-change: transform, box-shadow;
        }
        
        @keyframes scaleUpDown {
          0% {
            transform: scale(1) rotate(-6deg);
          }
          100% {
            transform: scale(1.1) rotate(-6deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(66, 153, 225, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(66, 153, 225, 0.9);
          }
        }
        
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          will-change: transform;
          transition: opacity 0.5s ease-in-out;
        }
        
        .stars::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 1px, transparent 1px);
          background-size: 100px 100px;
          animation: starsMove 60s linear infinite;
          will-change: transform;
        }
        
        .stars::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 200px 200px;
          animation: starsMove 120s linear infinite reverse;
          will-change: transform;
        }
        
        .stars-hover::before {
          animation-duration: 40s;
        }
        
        .stars-hover::after {
          animation-duration: 80s;
        }
        
        @keyframes starsMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  )
}

export default EnhancedBattlePreview