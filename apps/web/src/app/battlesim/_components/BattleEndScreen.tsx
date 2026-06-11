"use client"
import { Battle } from "@pkmn/client";
import { useTranslations } from "next-intl";
import { getParticipantName } from "../_utils/replayUtils";

export const BattleEndScreen = ({ battle, pov, username, onRestart }: {
  battle: Battle,
  pov: 0 | 1 | any,
  username?: string | null,
  onRestart?: () => void
}) => {
  const t = useTranslations('battlesim');
  const p1 = pov === 0 ? battle.p1 : battle.p2;
  const p2 = pov === 0 ? battle.p2 : battle.p1;

  const p1Name = getParticipantName(p1.name)
  const p2Name = getParticipantName(p2.name)

  let winner: string;
  let result: 'win' | 'loss' | 'tie';

  // First use the explicit winner from the battle if available
  if (battle.winner) {
    const winnerName = getParticipantName(battle.winner);
    winner = winnerName.trim();

    // Determine victory by comparing the winner against our logged-in username
    const myName = username?.trim() || (pov === 0 ? battle.p1.name : battle.p2.name);
    const isWin = winner === myName;

    console.log('[EndScreen]', { pov, winner, myName, isWin, p1Name, p2Name, battleWinner: battle.winner, username });

    result = isWin ? 'win' : 'loss';
  } else {
    // Fallback to checking remaining Pokemon if no explicit winner
    const p1HasPokemon = p1.team.some(p => !p.fainted);
    const p2HasPokemon = p2.team.some(p => !p.fainted);
    
    if (p1HasPokemon && !p2HasPokemon) {
      winner = p1Name;
      result = pov === 0 ? 'win' : 'loss';
    } else if (!p1HasPokemon && p2HasPokemon) {
      winner = p2Name;
      result = pov === 0 ? 'loss' : 'win';
    } else {
      winner = "__tie__";
      result = 'tie';
    }
  }
  
  return (
    <div 
      id="battle-end-screen" 
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      onClick={onRestart}
    >
      {/* Semi-transparent background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0" />

      {/* Result-colored glow sweep */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bsx-end-in"
        style={{
          background: `radial-gradient(ellipse at center 30%, ${
            result === 'win'
              ? "color-mix(in srgb, var(--emerald-500) 22%, transparent)"
              : result === 'tie'
              ? "color-mix(in srgb, var(--amber-400) 16%, transparent)"
              : "color-mix(in srgb, var(--rose-500) 10%, transparent)"
          }, transparent 65%)`,
        }}
      />

      {/* Content Container */}
      <div className="z-[200] flex flex-col items-center justify-center w-full h-full bsx-end-in">
        {/* Battle Result Banner */}
        <div className={`mb-8 text-5xl md:text-6xl font-extrabold ${result === 'win' ? "text-primary-500" : result === 'tie' ? "text-yellow-500" : "text-surface-300 saturate-50"} text-shadow-lg`}>
          {result === 'win' ? t('end.victory') : result === 'tie' ? t('end.tie') : t('end.defeat')}
        </div>
        
        {/* Main Content */}
        <div className="flex items-center justify-between w-full px-8 mb-12">
          {/* Trainer 1 */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-4 rounded-full bg-surface-800 bg-opacity-50 border-4 ${winner === p1Name ? 'border-primary-500' : 'border-surface-500'} shadow-lg overflow-hidden`}
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
            {winner === p1Name && result !== 'tie' && (
              <div className="mt-2 bg-primary-500 px-3 py-1 rounded-full text-white text-sm font-bold">
                {t('end.winner')}
              </div>
            )}
          </div>
          
          {/* VS Element */}
          <div className="flex flex-col items-center">
            <div className="relative scale-up-down-animation">
              <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary-500 text-shadow-lg transform rotate-6">
                {result !== 'tie' ? 'KO' : t('end.tie')}
              </div>
              <div className="absolute inset-0 text-6xl md:text-7xl lg:text-8xl font-extrabold text-white text-opacity-30 text-shadow-lg transform rotate-6 blur-md">
                {result !== 'tie' ? 'KO' : t('end.tie')}
              </div>
            </div>
            <div className="mt-4 text-lg text-white">
              {t('end.turn', { turn: battle.turn })}
            </div>
          </div>
          
          {/* Trainer 2 */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mb-4 rounded-full bg-surface-800 bg-opacity-50 border-4 ${winner === p2Name ? 'border-primary-500' : 'border-surface-500'} shadow-lg overflow-hidden`}
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
            {winner === p2Name && result !== 'tie' && (
              <div className="mt-2 bg-primary-500 px-3 py-1 rounded-full text-white text-sm font-bold">
                {t('end.winner')}
              </div>
            )}
          </div>
        </div>
        
        {/* Call to action button */}
        <button 
          className="mt-8 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onRestart && onRestart();
          }}
        >
          {t('end.backToStart')}
        </button>
      </div>

      {/* Add CSS for animation */}
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }
        
        .scale-up-down-animation {
          animation: scaleUpDown 1.5s infinite alternate ease-in-out;
        }
        
        @keyframes scaleUpDown {
          0% {
            transform: scale(1) rotate(6deg);
          }
          100% {
            transform: scale(1.1) rotate(6deg);
          }
        }
      `}</style>
    </div>
  );
};

export default BattleEndScreen;