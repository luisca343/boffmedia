"use client"
import { Battle } from "@pkmn/client";
import { ASPECT_RATIO } from "../_utils/viewUtils";
import useViewportWidth from "@/services/useViewPortWidth";

function getParticipantName(name: string) {
  if (name.includes('player:')) {
    return name.split(':')[2];
  }

  if (name.includes('npc:')) {
    return name.split(':')[1];
  }

  return name;
}

export const BattlePreview = ({ battle, pov, onStartBattle }: { 
  battle: Battle, 
  pov: 0 | 1 | any,
  onStartBattle?: () => void 
}) => {
  const [, canvasWidth] = useViewportWidth();
  
  const p1 = pov === 0 ? battle.p1 : battle.p2;
  const p2 = pov === 0 ? battle.p2 : battle.p1;
  
  const p1Name = getParticipantName(p1.name);
  const p2Name = getParticipantName(p2.name);
  
  return (
    <div 
      id="battle-preview" 
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      onClick={onStartBattle}
    >
      {/* Semi-transparent background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0" />
      
      {/* Content Container */}
      <div className="z-10 flex flex-col items-center justify-center w-full h-full">
        {/* Main Content */}
        <div className="flex items-center justify-between w-full px-8 mb-12">
          {/* Trainer 1 */}
          <div className="flex flex-col items-center">
            <div 
              className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-4 rounded-full bg-surface-800 bg-opacity-50 border-4 border-primary-500 shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(/battlesim/trainers/${p1Name.toLowerCase()}.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Fallback if no image */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold text-white">
                  {p1Name.charAt(0)}
                </span>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-shadow-lg">
              {p1Name}
            </h2>
          </div>
          
          {/* VS Element */}
          <div className="flex flex-col items-center">
            <div className="relative scale-up-down-animation">
              <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary-500 text-shadow-lg transform -rotate-6">
                VS
              </div>
              <div className="absolute inset-0 text-6xl md:text-7xl lg:text-8xl font-extrabold text-white text-opacity-30 text-shadow-lg transform -rotate-6 blur-md">
                VS
              </div>
            </div>
          </div>
          
          {/* Trainer 2 */}
          <div className="flex flex-col items-center">
            <div 
              className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-4 rounded-full bg-surface-800 bg-opacity-50 border-4 border-surface-500 shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(/battlesim/trainers/${p2Name.toLowerCase()}.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Fallback if no image */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold text-white">
                  {p2Name.charAt(0)}
                </span>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-shadow-lg">
              {p2Name}
            </h2>
          </div>
        </div>
      </div>

      {/* Add CSS for animation */}
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }
        
        .scale-up-down-animation {
          animation: scaleUpDown 1s infinite alternate ease-in-out;
        }
        
        @keyframes scaleUpDown {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default BattlePreview;