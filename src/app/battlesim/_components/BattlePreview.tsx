"use client"
import type { Battle } from "@pkmn/client"
import useViewportWidth from "@/services/useViewPortWidth"
import { PokemonTeam } from "./PokemonTeam"
import { useEffect, useState } from "react"
import BattlePreviewAvatar from "./BattlePreviewAvatar"

function getParticipantName(name: string) {
  if (name.includes("player:")) {
    return name.split(":")[2]
  }

  if (name.includes("npc:")) {
    return name.split(":")[1]
  }

  return name
}

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
    >
      {/* Dynamic background with battle arena */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-purple-900 z-0">
        {/* Battle arena floor */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-800 to-transparent"></div>

        {/* Animated particles */}
        <div className="stars"></div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center justify-between w-full h-full relative z-10 py-8">
        {/* Player Sprites */}
        <div className="relative w-full flex items-end justify-between px-8 md:px-16 mt-auto mb-8">
          {/* Player 1 Avatar */}
          <div
            className={`transition-all duration-700 delay-400 ${isLoaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <BattlePreviewAvatar side={p1} pov={pov} size="large" className="drop-shadow-2xl" />
          </div>

          {/* VS Element */}
          <div
            className={`flex flex-col items-center z-20 transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 transform-none" : "opacity-0 scale-50"}`}
          >
            <div className="relative scale-up-down-animation">
              <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary-500 text-shadow-lg transform -rotate-6">
                VS
              </div>
              <div className="absolute inset-0 text-6xl md:text-7xl lg:text-8xl font-extrabold text-white text-opacity-30 text-shadow-lg transform -rotate-6 blur-md">
                VS
              </div>
            </div>
          </div>

          {/* Player 2 Avatar */}
          <div
            className={`transition-all duration-700 delay-400 ${isLoaded ? "opacity-100 transform-none" : "opacity-0 translate-y-10"}`}
          >
            <BattlePreviewAvatar side={p2} pov={pov === 0 ? 1 : 0} size="large" className="drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }
        
        .scale-up-down-animation {
          animation: scaleUpDown 1.5s infinite alternate ease-in-out;
        }
        
        .pulse-animation {
          animation: pulse 2s infinite;
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

